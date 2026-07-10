import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { CreateOrderDto } from "../dto/create-order.dto";
import { UpdateOrderDto } from "../dto/update-order.dto";
import { CreatePublicOrderDto } from "../dto/create-public-order.dto";
import { normalizePhone } from "../../../common/utils/phone.util";
import { parsePagination } from "../../../common/utils/pagination.util";
import { calculateOrderTotal } from "@fortifykitchen/shared";
import { Order, LineItem } from "@fortifykitchen/types";
import {
  OrderStatus,
  OrderSource,
  PaymentState,
  OrderFulfillmentType,
  PaymentMethod,
  PaymentStatus,
  Decimal,
  Prisma,
} from "@fortifykitchen/database";

// Statuses that still count as "in flight" — mirrors
// packages/shared's ACTIVE_ORDER_STATUSES, duplicated as a Prisma-enum-typed
// const here since the API layer works with the Prisma enum, not the
// string-literal type from @fortifykitchen/types.
const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING_CONFIRMATION,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.OUT_FOR_DELIVERY,
];

type OrderWithItemsAndSub = Prisma.OrderGetPayload<{
  include: { items: true; subscription: { select: { packageName: true } } };
}>;

@Injectable()
export class OrdersService {
  constructor(private readonly db: DatabaseService) {}

  // Looks up each menuItemId's current protein/flavor/size/price and builds
  // the LineItem[] shape the shared discount engine expects — the server
  // is the source of truth for pricing, never the client.
  private async buildLineItems(items: any[]): Promise<LineItem[]> {
    const lineItems: LineItem[] = [];
    for (const item of items) {
      if (item.menuItemId) {
        const menuItem = await this.db.client.menuItem.findUnique({ where: { id: item.menuItemId } });
        if (!menuItem) {
          throw new BadRequestException(`Menu item ${item.menuItemId} not found`);
        }
        lineItems.push({
          menuItemId: menuItem.id,
          protein: menuItem.protein as LineItem["protein"],
          flavor: menuItem.flavor,
          sizeGrams: menuItem.sizeGrams,
          unitPrice: menuItem.price,
          qty: item.qty,
        });
      } else {
        if (!item.protein || !item.flavor || !item.sizeGrams || item.unitPrice === undefined) {
          throw new BadRequestException("Custom items must specify protein, flavor, sizeGrams, and unitPrice");
        }
        lineItems.push({
          menuItemId: null as any,
          protein: item.protein.toUpperCase() as LineItem["protein"],
          flavor: item.flavor,
          sizeGrams: item.sizeGrams,
          unitPrice: item.unitPrice,
          qty: item.qty,
        });
      }
    }
    return lineItems;
  }

  // Whether every line item's menu item currently has enough stockQuantity
  // to cover the requested qty (same menuItemId appearing on more than one
  // line is summed first) — an order only qualifies as IMMEDIATE if ALL of
  // its items clear this bar; a single short item pushes the WHOLE order to
  // SCHEDULED rather than splitting it.
  private async resolveFulfillment(
    items: any[],
  ): Promise<{ fulfillmentType: OrderFulfillmentType; requiredByMenuItem: Map<string, number> }> {
    const requiredByMenuItem = new Map<string, number>();
    let allInStock = true;

    for (const item of items) {
      if (!item.menuItemId) {
        allInStock = false;
        continue;
      }
      requiredByMenuItem.set(item.menuItemId, (requiredByMenuItem.get(item.menuItemId) ?? 0) + item.qty);
    }

    if (allInStock) {
      for (const [menuItemId, requiredQty] of requiredByMenuItem) {
        const menuItem = await this.db.client.menuItem.findUnique({ where: { id: menuItemId } });
        if (!menuItem || menuItem.stockQuantity < requiredQty) {
          allInStock = false;
          break;
        }
      }
    }

    return {
      fulfillmentType: allInStock ? OrderFulfillmentType.IMMEDIATE : OrderFulfillmentType.SCHEDULED,
      requiredByMenuItem,
    };
  }

  // Decrements stockQuantity for every menu item in an IMMEDIATE order,
  // inside the given transaction client. Uses a conditional
  // `stockQuantity: { gte: qty }` guard + updateMany so a race between two
  // concurrent orders can't drive stock negative — if the guard doesn't
  // match (someone else grabbed the stock first) this throws, and the whole
  // order creation rolls back.
  private async decrementStock(tx: Prisma.TransactionClient, requiredByMenuItem: Map<string, number>): Promise<void> {
    for (const [menuItemId, qty] of requiredByMenuItem) {
      const result = await tx.menuItem.updateMany({
        where: { id: menuItemId, stockQuantity: { gte: qty } },
        data: { stockQuantity: { decrement: qty } },
      });
      if (result.count === 0) {
        throw new BadRequestException(
          `Stock for menu item ${menuItemId} changed before this order could be confirmed — please retry.`,
        );
      }
    }
  }

  // Restores stockQuantity for every menu item in a previously-IMMEDIATE
  // order — used when that order is edited, cancelled, or deleted before
  // being delivered, so stock counts stay accurate.
  private async restockItems(tx: Prisma.TransactionClient, requiredByMenuItem: Map<string, number>): Promise<void> {
    for (const [menuItemId, qty] of requiredByMenuItem) {
      await tx.menuItem.updateMany({
        where: { id: menuItemId },
        data: { stockQuantity: { increment: qty } },
      });
    }
  }

  private requiredByMenuItemFromOrderItems(items: { menuItemId: string | null; qty: number }[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const item of items) {
      if (!item.menuItemId) continue; // menu item was deleted since — nothing to restock
      map.set(item.menuItemId, (map.get(item.menuItemId) ?? 0) + item.qty);
    }
    return map;
  }

  // Looks up + validates a discount code for a given customer, WITHOUT
  // claiming it — the actual one-redemption-per-customer claim happens
  // atomically inside the order-creation transaction (see
  // createForCustomer), since a plain check here would leave a race window
  // between two concurrent orders both reading "not yet redeemed."
  // Mirrors DiscountsService.verify's active/date-window rules, plus an
  // ownership check for personal (customerId-scoped) vouchers — decided:
  // codes stack additively with the automatic tier discount rather than
  // replacing it (see createForCustomer).
  private async resolveDiscount(
    code: string,
    customerId: string,
  ): Promise<{ id: string; code: string; type: string; amount: Decimal; customerId: string | null }> {
    const normalized = code.trim().toUpperCase();
    const discount = await this.db.client.discount.findUnique({ where: { code: normalized } });
    if (!discount) {
      throw new NotFoundException(`Discount code "${code}" not found`);
    }
    const now = new Date();
    if (!discount.isActive) {
      throw new BadRequestException(`Discount code "${code}" is no longer active`);
    }
    if (now < discount.startsAt || now > discount.endsAt) {
      throw new BadRequestException(`Discount code "${code}" is not valid at this time`);
    }
    if (discount.customerId && discount.customerId !== customerId) {
      throw new BadRequestException(`Discount code "${code}" is not valid for your account`);
    }
    return discount;
  }

  // Amount this discount knocks off `lineSubtotal`, clamped so it can never
  // exceed the subtotal it's applied against (a FIXED discount larger than
  // the order shouldn't produce a negative total).
  private computeDiscountAmount(discount: { type: string; amount: Decimal }, lineSubtotal: number): number {
    const amount = Number(discount.amount);
    const raw = discount.type === "PERCENTAGE" ? (lineSubtotal * amount) / 100 : amount;
    return Math.min(Math.max(raw, 0), lineSubtotal);
  }

  async create(dto: CreateOrderDto, userId?: string, userRole?: string): Promise<Order> {
    let customerId = dto.customerId;

    if (userRole === "CUSTOMER" && userId) {
      const customer = await this.db.client.customer.findFirst({ where: { userId } });
      if (!customer) {
        throw new NotFoundException(`Customer profile not found for user ID ${userId}`);
      }
      customerId = customer.id;
    } else {
      if (!customerId) {
        throw new BadRequestException("Field 'customerId' is required");
      }
      const customer = await this.db.client.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        throw new NotFoundException(`Customer with ID ${customerId} not found`);
      }
    }

    const customer = await this.db.client.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    // Update customer address if it is not set on customer profile
    if (dto.deliveryAddress && !customer.address) {
      await this.db.client.customer.update({
        where: { id: customer.id },
        data: { address: dto.deliveryAddress },
      });
    }

    return this.createForCustomer(
      customer,
      dto.items,
      dto.deliveryDate,
      dto.paymentStatus,
      dto.notes,
      dto.paymentMethod,
      dto.deliveryAddress ?? customer.address ?? undefined,
      dto.discountCode,
    );
  }

  // Customer self-checkout — no login system yet, so phone number is the
  // identity: reuse an existing Customer with this phone, or create one on
  // the fly (mirroring how staff add ad-hoc customers today). Everything
  // else (fulfillment resolution, stock decrement, pricing) is identical to
  // the staff-facing create() above — same rules apply regardless of who's
  // placing the order.
  async createPublic(dto: CreatePublicOrderDto): Promise<Order> {
    const phone = normalizePhone(dto.phone);
    let customer = await this.db.client.customer.findFirst({ where: { phone } });
    if (!customer) {
      customer = await this.db.client.customer.create({
        data: { name: dto.name, phone, address: dto.address },
      });
    } else if (dto.address && !customer.address) {
      customer = await this.db.client.customer.update({
        where: { id: customer.id },
        data: { address: dto.address },
      });
    }

    const fallbackDeliveryDate = dto.deliveryDate ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    return this.createForCustomer(
      customer,
      dto.items,
      fallbackDeliveryDate,
      undefined,
      dto.notes,
      dto.paymentMethod,
      dto.address,
      dto.discountCode,
    );
  }

  // Order history for the customer-web "My Orders" view — same phone-based
  // identity check used by the subscriptions self-service view.
  async findForPhone(phone: string): Promise<Order[]> {
    const customer = await this.db.client.customer.findFirst({ where: { phone: normalizePhone(phone) } });
    if (!customer) return [];
    const orders = await this.db.client.order.findMany({
      where: { customerId: customer.id },
      include: { items: true, subscription: { select: { packageName: true } } },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((o) => this.mapOrder(o));
  }

  private async createForCustomer(
    customer: { id: string; name: string },
    items: any[],
    deliveryDateInput: string,
    paymentStatus: PaymentState | undefined,
    notes: string | undefined,
    paymentMethod?: PaymentMethod,
    deliveryAddress?: string,
    discountCodeInput?: string,
  ): Promise<Order> {
    const lineItems = await this.buildLineItems(items);
    const pricing = calculateOrderTotal(lineItems);
    const { fulfillmentType, requiredByMenuItem } = await this.resolveFulfillment(items);

    const deliveryDate = fulfillmentType === OrderFulfillmentType.IMMEDIATE ? new Date() : new Date(deliveryDateInput);

    // Resolved here (read-only) so validation errors surface before we open
    // a transaction; the actual one-redemption-per-customer CLAIM still
    // happens inside the transaction below via a unique-constraint insert,
    // since that's the only way to close the race between two concurrent
    // orders both redeeming the same single-use code.
    const discount = discountCodeInput ? await this.resolveDiscount(discountCodeInput, customer.id) : null;

    // Stacking, per business decision: a discount code ADDS to the
    // automatic tier discount rather than replacing it (max/best-of-both
    // was the original proposal — overridden). Both amounts are computed
    // off the same post-meat-discount lineSubtotal and combined, clamped so
    // the total discount can never exceed the subtotal itself.
    const codeDiscountAmount = discount ? this.computeDiscountAmount(discount, pricing.lineSubtotal) : 0;
    const combinedDiscountAmount = Math.min(pricing.orderDiscountAmount + codeDiscountAmount, pricing.lineSubtotal);
    const total = Math.round(pricing.lineSubtotal - combinedDiscountAmount);

    const order = await this.db.client.$transaction(async (tx) => {
      if (fulfillmentType === OrderFulfillmentType.IMMEDIATE) {
        await this.decrementStock(tx, requiredByMenuItem);
      }

      // Wallet orders are always paid in full at placement (decided: never
      // negative, no admin override) — a guarded updateMany makes the
      // balance check + deduction atomic against concurrent spends, same
      // race-safety pattern as decrementStock above. If it doesn't match,
      // the balance was short and the whole order rolls back.
      let resolvedPaymentStatus = paymentStatus ?? PaymentState.UNPAID;
      if (paymentMethod === PaymentMethod.WALLET) {
        const result = await tx.customer.updateMany({
          where: { id: customer.id, walletBalance: { gte: total } },
          data: { walletBalance: { decrement: total } },
        });
        if (result.count === 0) {
          throw new BadRequestException("Wallet balance is insufficient to pay for this order.");
        }
        resolvedPaymentStatus = PaymentState.PAID;
      }

      const created = await tx.order.create({
        data: {
          customerId: customer.id,
          customerName: customer.name,
          deliveryDate,
          paymentStatus: resolvedPaymentStatus,
          status: OrderStatus.PENDING_CONFIRMATION,
          fulfillmentType,
          paymentMethod: paymentMethod ?? "CASH_ON_DELIVERY",
          deliveryAddress,
          subtotal: Math.round(pricing.lineSubtotal),
          discountAmount: Math.round(combinedDiscountAmount),
          discountCode: discount?.code,
          total,
          notes,
          source: OrderSource.ONE_OFF,
          items: {
            create: lineItems.map((l) => ({
              menuItemId: l.menuItemId,
              protein: l.protein,
              flavor: l.flavor,
              sizeGrams: l.sizeGrams,
              unitPrice: l.unitPrice,
              qty: l.qty,
            })),
          },
        },
        include: { items: true, subscription: { select: { packageName: true } } },
      });

      // Ledger entry so wallet spend shows up alongside plan-purchase
      // top-ups in the Payment table.
      if (paymentMethod === PaymentMethod.WALLET) {
        await tx.payment.create({
          data: {
            orderId: created.id,
            customerId: customer.id,
            amount: new Decimal(total),
            method: PaymentMethod.WALLET,
            status: PaymentStatus.COMPLETED,
          },
        });
      }

      // Atomically claim the redemption — relies on the
      // @@unique([discountId, customerId]) constraint to throw (rather than
      // a racy check-then-write) if a concurrent order already redeemed
      // this code for this customer, rolling back everything above
      // (stock, wallet, order) along with it.
      if (discount) {
        try {
          await tx.discountRedemption.create({
            data: { discountId: discount.id, customerId: customer.id, orderId: created.id },
          });
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            throw new BadRequestException(`Discount code "${discount.code}" has already been used on your account.`);
          }
          throw err;
        }

        // Personal plan-purchase vouchers only ever had one eligible
        // customer — hard-deactivate on use rather than relying solely on
        // the redemption row.
        if (discount.customerId) {
          await tx.discount.update({ where: { id: discount.id }, data: { isActive: false } });
        }
      }

      return created;
    });

    return this.mapOrder(order);
  }

  // Creates one subscription-generated occurrence as a normal Order row —
  // called by SubscriptionsService.syncUpcomingOrders. Subscription
  // occurrences are never IMMEDIATE (they're not fulfilled from live
  // storefront stock — the whole point of a subscription pool is prepped
  // ahead of the scheduled date), so fulfillmentType is always SCHEDULED
  // and no stock decrement happens here.
  async createFromSubscription(params: {
    subscriptionId: string;
    customerId: string | null;
    customerName: string;
    deliveryAddress?: string;
    deliveryDate: Date;
    items: { menuItemId: string; protein: LineItem["protein"]; flavor: string; sizeGrams: number; unitPrice: number; qty: number }[];
  }): Promise<Order> {
    const pricing = calculateOrderTotal(params.items);
    const order = await this.db.client.order.create({
      data: {
        customerId: params.customerId ?? undefined,
        customerName: params.customerName,
        deliveryDate: params.deliveryDate,
        paymentStatus: PaymentState.UNPAID,
        status: OrderStatus.PENDING_CONFIRMATION,
        fulfillmentType: OrderFulfillmentType.SCHEDULED,
        paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
        deliveryAddress: params.deliveryAddress,
        subtotal: Math.round(pricing.lineSubtotal),
        discountAmount: Math.round(pricing.orderDiscountAmount),
        total: Math.round(pricing.finalTotal),
        source: OrderSource.SUBSCRIPTION,
        subscriptionId: params.subscriptionId,
        items: {
          create: params.items.map((l) => ({
            menuItemId: l.menuItemId,
            protein: l.protein,
            flavor: l.flavor,
            sizeGrams: l.sizeGrams,
            unitPrice: l.unitPrice,
            qty: l.qty,
          })),
        },
      },
      include: { items: true, subscription: { select: { packageName: true } } },
    });
    return this.mapOrder(order);
  }

  async findForUser(userId: string): Promise<Order[]> {
    const customer = await this.db.client.customer.findFirst({ where: { userId } });
    if (!customer) return [];
    const orders = await this.db.client.order.findMany({
      where: { customerId: customer.id },
      include: { items: true, subscription: { select: { packageName: true } } },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((o) => this.mapOrder(o));
  }

  // General-purpose list — covers what used to be three separate admin
  // views (Orders / Orders from Subscriptions / Deliveries): both order
  // sources live in the same table now, so `source` is just a filter.
  async findAll(filters?: { page?: string; limit?: string; source?: OrderSource; status?: OrderStatus; date?: string }): Promise<Order[]> {
    const { skip, take } = parsePagination(filters?.page, filters?.limit);
    const orders = await this.db.client.order.findMany({
      where: {
        source: filters?.source,
        status: filters?.status,
        deliveryDate: filters?.date ? new Date(filters.date) : undefined,
      },
      include: { items: true, subscription: { select: { packageName: true } } },
      // Oldest first — matches the admin Orders tab, which lists orders
      // chronologically so the oldest still-open ones surface first.
      orderBy: { deliveryDate: "asc" },
      ...(skip !== undefined ? { skip } : {}),
      ...(take !== undefined ? { take } : {}),
    });
    return orders.map((o) => this.mapOrder(o));
  }

  // Upcoming (today onward, still-active) orders of either source, grouped
  // by day/ISO-week/month — replaces DeliveryService.findUpcomingGrouped.
  async findUpcomingGrouped(groupBy: "day" | "week" | "month" = "week") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await this.db.client.order.findMany({
      where: { deliveryDate: { gte: today }, status: { in: ACTIVE_STATUSES } },
      include: { items: true, subscription: { select: { packageName: true } } },
      orderBy: { deliveryDate: "asc" },
    });
    const upcoming = orders.map((o) => this.mapOrder(o));

    const groups = new Map<string, Order[]>();
    for (const entry of upcoming) {
      const d = new Date(entry.deliveryDate);
      let key: string;
      if (groupBy === "day") {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      } else if (groupBy === "month") {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      } else {
        // ISO-ish week key: year + week number (Mon-start)
        const dayNum = (d.getDay() + 6) % 7;
        const thursday = new Date(d);
        thursday.setDate(d.getDate() - dayNum + 3);
        const firstThursday = new Date(thursday.getFullYear(), 0, 4);
        const weekNum =
          1 + Math.round(((thursday.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
        key = `${thursday.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
      }
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    }

    return Array.from(groups.entries()).map(([key, entries]) => ({
      key,
      count: entries.length,
      totalItems: entries.reduce((s, e) => s + e.items.reduce((si, i) => si + i.qty, 0), 0),
      entries,
    }));
  }

  // Full order history for one subscription — replaces
  // SubscriptionsService.findDeliveries / DeliveryService.findBySubscription.
  async findBySubscription(subscriptionId: string): Promise<Order[]> {
    const orders = await this.db.client.order.findMany({
      where: { subscriptionId },
      include: { items: true, subscription: { select: { packageName: true } } },
      orderBy: { deliveryDate: "asc" },
    });
    return orders.map((o) => this.mapOrder(o));
  }

  // Upcoming (still-active), next-N occurrences for one subscription — used
  // by the public phone-lookup view (PublicSubscriptionsController.lookup).
  async findUpcomingForSubscription(subscriptionId: string, limit = 5): Promise<Order[]> {
    const orders = await this.db.client.order.findMany({
      where: { subscriptionId, status: { in: ACTIVE_STATUSES } },
      include: { items: true, subscription: { select: { packageName: true } } },
      orderBy: { deliveryDate: "asc" },
      take: limit,
    });
    return orders.map((o) => this.mapOrder(o));
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.db.client.order.findUnique({
      where: { id },
      include: { items: true, subscription: { select: { packageName: true } } },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return this.mapOrder(order);
  }

  // Verifies an order actually belongs to a subscription owned by the
  // customer with this phone number, before allowing the public postpone
  // action — prevents anyone from postponing an arbitrary order id.
  async verifySubscriptionOrderOwnership(orderId: string, phone: string): Promise<boolean> {
    const order = await this.db.client.order.findUnique({
      where: { id: orderId },
      include: { subscription: { include: { customer: true } } },
    });
    if (!order?.subscription) return false;
    return normalizePhone(order.subscription.customer?.phone ?? "") === normalizePhone(phone);
  }

  // Edits resend the full form and get repriced from scratch — old line
  // items are dropped and replaced rather than diffed, since orders are
  // small (a handful of line items) and this keeps the pricing engine as
  // the single source of truth with no partial-update drift. Stock is
  // restored for the old IMMEDIATE items (if any) before the new
  // fulfillment type is resolved and, if IMMEDIATE again, re-decremented —
  // all inside one transaction so a mid-edit failure can't leave stock
  // half-adjusted.
  async update(id: string, dto: UpdateOrderDto): Promise<Order> {
    const existing = await this.db.client.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const customer = await this.db.client.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    const lineItems = await this.buildLineItems(dto.items);
    const pricing = calculateOrderTotal(lineItems);

    const order = await this.db.client.$transaction(async (tx) => {
      // Restore stock from the previous IMMEDIATE fulfillment, if any, so
      // the fresh fulfillment check below sees accurate availability.
      if (existing.fulfillmentType === OrderFulfillmentType.IMMEDIATE) {
        const oldRequired = this.requiredByMenuItemFromOrderItems(existing.items);
        await this.restockItems(tx, oldRequired);
      }

      // Re-resolve fulfillment against post-restock stock levels.
      const requiredByMenuItem = new Map<string, number>();
      let allInStock = true;
      for (const item of dto.items) {
        if (!item.menuItemId) {
          allInStock = false;
          continue;
        }
        requiredByMenuItem.set(item.menuItemId, (requiredByMenuItem.get(item.menuItemId) ?? 0) + item.qty);
      }
      if (allInStock) {
        for (const [menuItemId, requiredQty] of requiredByMenuItem) {
          const menuItem = await tx.menuItem.findUnique({ where: { id: menuItemId } });
          if (!menuItem || menuItem.stockQuantity < requiredQty) {
            allInStock = false;
            break;
          }
        }
      }
      const fulfillmentType = allInStock ? OrderFulfillmentType.IMMEDIATE : OrderFulfillmentType.SCHEDULED;

      if (fulfillmentType === OrderFulfillmentType.IMMEDIATE) {
        await this.decrementStock(tx, requiredByMenuItem);
      }

      const deliveryDate = fulfillmentType === OrderFulfillmentType.IMMEDIATE ? new Date() : new Date(dto.deliveryDate);

      await tx.orderItem.deleteMany({ where: { orderId: id } });
      return tx.order.update({
        where: { id },
        data: {
          customerId: customer.id,
          customerName: customer.name,
          deliveryDate,
          paymentStatus: dto.paymentStatus ?? PaymentState.UNPAID,
          fulfillmentType,
          subtotal: Math.round(pricing.lineSubtotal),
          discountAmount: Math.round(pricing.orderDiscountAmount),
          total: Math.round(pricing.finalTotal),
          notes: dto.notes,
          items: {
            create: lineItems.map((l) => ({
              menuItemId: l.menuItemId,
              protein: l.protein,
              flavor: l.flavor,
              sizeGrams: l.sizeGrams,
              unitPrice: l.unitPrice,
              qty: l.qty,
            })),
          },
        },
        include: { items: true, subscription: { select: { packageName: true } } },
      });
    });

    return this.mapOrder(order);
  }

  // Unified status transition for both order sources.
  //  - CANCELLED: frees stock back up for a previously-IMMEDIATE order
  //    (guarded so repeated no-op updates can't double-restock).
  //  - COMPLETED: for a subscription-sourced order, also deducts the
  //    delivered grams from the matching protein pool(s) — see
  //    markCompleted, which this delegates to so the deduction can never be
  //    skipped by calling this generic method directly.
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    if (status === OrderStatus.COMPLETED) {
      return this.markCompleted(id);
    }

    const existing = await this.db.client.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const order = await this.db.client.$transaction(async (tx) => {
      if (status === OrderStatus.CANCELLED && existing.status !== OrderStatus.CANCELLED && existing.fulfillmentType === OrderFulfillmentType.IMMEDIATE) {
        const required = this.requiredByMenuItemFromOrderItems(existing.items);
        await this.restockItems(tx, required);
      }

      return tx.order.update({
        where: { id },
        data: { status },
        include: { items: true, subscription: { select: { packageName: true } } },
      });
    });

    return this.mapOrder(order);
  }

  // Marks an order COMPLETED and, if it belongs to a subscription, deducts
  // the delivered grams from each matching protein pool in the same
  // transaction. Idempotent — calling this on an already-COMPLETED order is
  // a no-op rather than double-deducting, protecting balance integrity even
  // against duplicate/retried requests.
  async markCompleted(id: string): Promise<Order> {
    const existing = await this.db.client.order.findUnique({
      where: { id },
      include: { items: true, subscription: { include: { pools: true } } },
    });
    if (!existing) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    if (existing.status === OrderStatus.COMPLETED) {
      return this.findOne(id);
    }
    if (existing.status === OrderStatus.CANCELLED) {
      throw new BadRequestException("Không thể hoàn thành một đơn đã bị hủy");
    }

    await this.db.client.$transaction(async (tx) => {
      if (existing.subscription) {
        const gramsByProtein: Record<string, number> = {};
        for (const item of existing.items) {
          gramsByProtein[item.protein] = (gramsByProtein[item.protein] ?? 0) + item.qty * item.sizeGrams;
        }
        for (const pool of existing.subscription.pools) {
          const deduction = gramsByProtein[pool.protein];
          if (!deduction) continue;
          await tx.subscriptionPool.update({
            where: { id: pool.id },
            data: { remainingGrams: Math.max(0, pool.remainingGrams - deduction) },
          });
        }
      }

      await tx.order.update({ where: { id }, data: { status: OrderStatus.COMPLETED } });

      // If every pool is fully consumed, close out the subscription.
      if (existing.subscriptionId) {
        const refreshedPools = await tx.subscriptionPool.findMany({ where: { subscriptionId: existing.subscriptionId } });
        const allDepleted = refreshedPools.length > 0 && refreshedPools.every((p) => p.remainingGrams <= 0);
        if (allDepleted) {
          await tx.subscription.update({ where: { id: existing.subscriptionId }, data: { status: "COMPLETED" } });
        }
      }
    });

    return this.findOne(id);
  }

  // Postpones a not-yet-completed subscription-sourced order — the
  // conserve-for-later requirement: no pool deduction happens (deduction
  // only ever happens in markCompleted), and rather than leaving a gap, the
  // WHOLE remaining schedule for that subscription shifts forward by one
  // delivery interval so spacing between occurrences stays consistent.
  async postpone(id: string): Promise<Order> {
    const order = await this.db.client.order.findUnique({
      where: { id },
      include: { subscription: true },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    if (!order.subscription) {
      throw new BadRequestException("Chỉ có thể hoãn các đơn thuộc gói đăng ký");
    }
    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException("Chỉ có thể hoãn các đơn đang chờ hoặc đang xử lý");
    }

    const interval = order.subscription.deliveryIntervalDays;
    const affected = await this.db.client.order.findMany({
      where: {
        subscriptionId: order.subscriptionId,
        deliveryDate: { gte: order.deliveryDate },
        status: { in: ACTIVE_STATUSES },
      },
      orderBy: { deliveryDate: "asc" },
    });

    await this.db.client.$transaction(async (tx) => {
      for (const o of affected) {
        const newDate = new Date(o.deliveryDate);
        newDate.setDate(newDate.getDate() + interval);
        const noteLine = `Hoãn từ ${o.deliveryDate.toISOString().split("T")[0]} sang ${newDate.toISOString().split("T")[0]}`;
        await tx.order.update({
          where: { id: o.id },
          data: {
            deliveryDate: newDate,
            notes: o.notes ? `${o.notes}\n${noteLine}` : noteLine,
          },
        });
      }
      await tx.subscription.update({
        where: { id: order.subscriptionId! },
        data: { postponedCount: { increment: 1 } },
      });
    });

    return this.findOne(id);
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentState): Promise<Order> {
    await this.findOne(id);
    const order = await this.db.client.order.update({
      where: { id },
      data: { paymentStatus },
      include: { items: true, subscription: { select: { packageName: true } } },
    });
    return this.mapOrder(order);
  }

  // Deleting an order still holding un-delivered IMMEDIATE stock restores
  // it first.
  async remove(id: string): Promise<void> {
    const existing = await this.db.client.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    await this.db.client.$transaction(async (tx) => {
      if (existing.fulfillmentType === OrderFulfillmentType.IMMEDIATE && existing.status !== OrderStatus.COMPLETED) {
        const required = this.requiredByMenuItemFromOrderItems(existing.items);
        await this.restockItems(tx, required);
      }
      await tx.order.delete({ where: { id } });
    });
  }

  private mapOrder(order: OrderWithItemsAndSub): Order {
    return {
      id: order.id,
      customerId: order.customerId ?? undefined,
      customerName: order.customerName,
      deliveryDate: order.deliveryDate,
      paymentStatus: order.paymentStatus as Order["paymentStatus"],
      status: order.status as Order["status"],
      fulfillmentType: order.fulfillmentType as Order["fulfillmentType"],
      paymentMethod: order.paymentMethod as Order["paymentMethod"],
      deliveryAddress: order.deliveryAddress ?? undefined,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      discountCode: order.discountCode ?? undefined,
      total: order.total,
      notes: order.notes ?? undefined,
      items: order.items.map((i) => ({
        id: i.id,
        orderId: i.orderId,
        menuItemId: i.menuItemId ?? undefined,
        protein: i.protein as Order["items"][number]["protein"],
        flavor: i.flavor,
        sizeGrams: i.sizeGrams,
        unitPrice: i.unitPrice,
        qty: i.qty,
      })),
      source: order.source as Order["source"],
      subscriptionId: order.subscriptionId ?? undefined,
      packageName: order.subscription?.packageName,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
