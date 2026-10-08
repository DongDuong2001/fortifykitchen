import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { CreateSubscriptionDto } from "../dto/create-subscription.dto";
import { UpdateSubscriptionDto } from "../dto/update-subscription.dto";
import { TopUpPoolDto } from "../dto/top-up-pool.dto";
import { normalizePhone } from "../../../common/utils/phone.util";
import { OrdersService } from "../../orders/service/orders.service";
import { calculatePoolPricing, addDays } from "@fortifykitchen/shared";
import { Subscription, SubscriptionPool } from "@fortifykitchen/types";
import { PaymentState, Protein, CustomPlanRequestStatus, PaymentMethod, PaymentStatus, Decimal, SubscriptionStatus } from "@fortifykitchen/database";

// How far ahead of "today" a subscription's Order occurrences get
// materialized. See syncUpcomingOrders — this is what makes requirement
// #2's "added 1 week before the delivery for easier management" true: we
// don't create every future occurrence at subscription creation time, only
// a rolling window, called again whenever the sync endpoint is hit
// (creation, and opportunistically from the admin Orders/Dashboard pages).
const SYNC_HORIZON_DAYS = 7;
const MAX_ORDERS_PER_SYNC = 60; // safety guard against runaway generation

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly ordersService: OrdersService,
  ) {}

  async create(dto: CreateSubscriptionDto): Promise<Subscription> {
    const customer = await this.db.client.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    if (dto.customPlanRequestId) {
      const request = await this.db.client.customPlanRequest.findUnique({ where: { id: dto.customPlanRequestId } });
      if (!request) {
        throw new NotFoundException(`Custom plan request with ID ${dto.customPlanRequestId} not found`);
      }
    }

    // Flatten to one (protein, sizeGrams, qty) entry per portion selection,
    // merging duplicates the client might send, so "CHICKEN 150g x30" sent
    // twice in one payload becomes a single x60 entry. Each protein's pool
    // is the sum of grams (sizeGrams * qty) across all its portion sizes.
    const portionTotals = new Map<string, { protein: Protein; sizeGrams: number; qty: number }>();
    for (const p of dto.pools) {
      for (const portion of p.portions) {
        const key = `${p.protein}:${portion.sizeGrams}`;
        const existing = portionTotals.get(key);
        if (existing) {
          existing.qty += portion.qty;
        } else {
          portionTotals.set(key, { protein: p.protein, sizeGrams: portion.sizeGrams, qty: portion.qty });
        }
      }
    }
    const portions = Array.from(portionTotals.values());

    const poolGrams = new Map<Protein, number>();
    for (const portion of portions) {
      poolGrams.set(portion.protein, (poolGrams.get(portion.protein) ?? 0) + portion.sizeGrams * portion.qty);
    }
    const pools = Array.from(poolGrams.entries()).map(([protein, totalGrams]) => ({ protein, totalGrams }));
    const totalGrams = pools.reduce((sum, p) => sum + p.totalGrams, 0);

    const availableMenuItems = await this.db.client.menuItem.findMany({
      where: { isAvailable: true, protein: { in: pools.map((p) => p.protein) } },
      select: { protein: true, price: true, sizeGrams: true },
    });

    const pricing = calculatePoolPricing(portions, availableMenuItems);
    if (pricing.missingCombos.length > 0) {
      throw new BadRequestException(
        `Không có món nào khả dụng cho: ${pricing.missingCombos.join(", ")} — vui lòng thêm món trong Thực đơn trước khi bán theo phần cho size này.`,
      );
    }
    const totalPrice = dto.totalPrice ?? Math.round(pricing.finalTotal);

    const subscription = await this.db.client.$transaction(async (tx: any) => {
      const created = await tx.subscription.create({
        data: {
          customerId: customer.id,
          customerName: customer.name,
          packageName: dto.packageName,
          totalGrams,
          deliveryAmountGrams: dto.deliveryAmountGrams,
          deliveryIntervalDays: dto.deliveryIntervalDays,
          startDate: new Date(dto.startDate),
          totalPrice,
          paymentStatus: dto.paymentStatus ?? PaymentState.UNPAID,
          status: "ACTIVE",
          pools: {
            create: pools.map((p) => ({
              protein: p.protein,
              totalGrams: p.totalGrams,
              remainingGrams: p.totalGrams,
            })),
          },
        },
        include: { pools: true },
      });

      // If this subscription was created to satisfy a customer's custom
      // plan request, link it back and mark the request MATCHED so it
      // drops off the admin's "pending" queue.
      if (dto.customPlanRequestId) {
        await tx.customPlanRequest.update({
          where: { id: dto.customPlanRequestId },
          data: { matchedSubscriptionId: created.id, status: CustomPlanRequestStatus.MATCHED },
        });
      }

      return created;
    });

    // Bootstrap the first week's worth of orders immediately so a
    // subscription starting today/tomorrow shows up in Prep List right away.
    await this.syncUpcomingOrders(subscription.id);

    const refreshed = await this.db.client.subscription.findUniqueOrThrow({
      where: { id: subscription.id },
      include: { pools: true },
    });
    return this.mapSubscription(refreshed);
  }

  async findAll(): Promise<Subscription[]> {
    const list = await this.db.client.subscription.findMany({
      include: { pools: true },
      orderBy: { startDate: "desc" },
    });
    return list.map((s: any) => this.mapSubscription(s));
  }

  async findOne(id: string): Promise<Subscription> {
    const sub = await this.db.client.subscription.findUnique({
      where: { id },
      include: { pools: true },
    });
    if (!sub) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
    return this.mapSubscription(sub);
  }

  async findForCustomer(customerId: string): Promise<Subscription[]> {
    const list = await this.db.client.subscription.findMany({
      where: { customerId },
      include: { pools: true },
      orderBy: { startDate: "desc" },
    });
    return list.map((s: any) => this.mapSubscription(s));
  }

  // Phone-based lookup for the customer-web self-service view — there's no
  // customer login system wired to this yet, so a phone number (which
  // staff already collect on every Customer record) stands in as the
  // identity check for read-only balance viewing and postponing an order.
  async findForPhone(phone: string): Promise<Subscription[]> {
    const customer = await this.db.client.customer.findFirst({ where: { phone: normalizePhone(phone) } });
    if (!customer) return [];
    return this.findForCustomer(customer.id);
  }

  async findForUser(userId: string): Promise<Subscription[]> {
    const customer = await this.db.client.customer.findFirst({ where: { userId } });
    if (!customer) return [];
    return this.findForCustomer(customer.id);
  }

  // Same shape as PublicSubscriptionsController.lookup's phone-based result
  // (each subscription enriched with its next few upcomingOrders) but keyed
  // off the logged-in JWT user instead of a typed-in phone number — lets the
  // customer-web Subscriptions tab auto-display a logged-in customer's own
  // plan without making them search for it.
  async findForUserWithUpcoming(userId: string) {
    const subs = await this.findForUser(userId);
    return Promise.all(
      subs.map(async (sub) => ({
        ...sub,
        upcomingOrders: await this.ordersService.findUpcomingForSubscription(sub.id, 5),
      })),
    );
  }

  // Postpone action for that same logged-in view — verifies ownership via
  // JWT userId instead of the public flow's phone query param.
  async postponeOrderForUser(orderId: string, userId: string) {
    const owns = await this.ordersService.verifySubscriptionOrderOwnershipByUser(orderId, userId);
    if (!owns) {
      throw new ForbiddenException("This delivery doesn't belong to your account.");
    }
    return this.ordersService.postpone(orderId);
  }

  async update(id: string, dto: UpdateSubscriptionDto): Promise<Subscription> {
    await this.findOne(id);

    const sub = await this.db.client.subscription.update({
      where: { id },
      data: {
        packageName: dto.packageName,
        totalPrice: dto.totalPrice,
        paymentStatus: dto.paymentStatus,
        status: dto.status,
        deliveryAmountGrams: dto.deliveryAmountGrams,
        deliveryIntervalDays: dto.deliveryIntervalDays,
      },
      include: { pools: true },
    });

    return this.mapSubscription(sub);
  }

  async updateStatus(
    id: string,
    status: SubscriptionStatus,
    requestingUser?: { id: string; role: string },
  ): Promise<Subscription> {
    const sub = await this.db.client.subscription.findUnique({ where: { id } });
    if (!sub) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    if (requestingUser?.role === "CUSTOMER") {
      const customer = await this.db.client.customer.findFirst({ where: { userId: requestingUser.id } });
      if (!customer || customer.id !== sub.customerId) {
        throw new ForbiddenException("You can only update the status of your own subscription.");
      }
      if (status !== "ACTIVE" && status !== "PAUSED") {
        throw new BadRequestException("Customers can only set status to ACTIVE or PAUSED.");
      }
    }

    const updated = await this.db.client.subscription.update({
      where: { id },
      data: { status },
      include: { pools: true },
    });

    return this.mapSubscription(updated);
  }

  // Adds more purchased weight to an existing pool, or creates a new one if
  // the subscription didn't originally include that protein. This is new
  // volume, not a correction — both totalGrams and remainingGrams increase.
  async topUpPool(id: string, dto: TopUpPoolDto): Promise<Subscription> {
    const sub = await this.db.client.subscription.findUnique({
      where: { id },
      include: { pools: true },
    });
    if (!sub) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    const existingPool = sub.pools.find((p: any) => p.protein === dto.protein);
    if (existingPool) {
      await this.db.client.subscriptionPool.update({
        where: { id: existingPool.id },
        data: {
          totalGrams: { increment: dto.grams },
          remainingGrams: { increment: dto.grams },
        },
      });
    } else {
      const availableMenuItems = await this.db.client.menuItem.count({
        where: { isAvailable: true, protein: dto.protein },
      });
      if (availableMenuItems === 0) {
        throw new BadRequestException(`Không có món nào khả dụng cho protein ${dto.protein}`);
      }
      await this.db.client.subscriptionPool.create({
        data: { subscriptionId: id, protein: dto.protein, totalGrams: dto.grams, remainingGrams: dto.grams },
      });
    }

    await this.db.client.subscription.update({
      where: { id },
      data: { totalGrams: { increment: dto.grams } },
    });

    // A top-up means there's more to schedule — pull forward what we can
    // within the usual 7-day horizon right away.
    await this.syncUpcomingOrders(id);

    return this.findOne(id);
  }

  // Funds a staff-built Subscription (typically from an approved
  // CustomPlanRequest) straight from the customer's wallet balance —
  // decided: this only ever happens in FULL, never a partial/split payment
  // with a bank transfer covering the rest. If the balance is short, the
  // customer tops up first (buys a SubscriptionPlan) or pays the whole
  // totalPrice by bank transfer instead (the existing `update()` /
  // paymentStatus flow), leaving the wallet untouched. See
  // docs/plan-and-credit-design.md. `Subscription` itself needs no schema
  // change for this — it's recorded via the Payment ledger, same as a
  // wallet-paid order.
  async payFromWallet(id: string, requestingUser?: { id: string; role: string }): Promise<Subscription> {
    const sub = await this.db.client.subscription.findUnique({ where: { id } });
    if (!sub) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
    if (!sub.customerId) {
      throw new BadRequestException("This subscription has no linked customer to charge.");
    }
    if (sub.paymentStatus === PaymentState.PAID) {
      throw new BadRequestException("This subscription is already paid.");
    }

    // A customer can only pay for their own subscription; staff can pay on
    // behalf of any customer (e.g. while on the phone finalizing a custom
    // plan request).
    if (requestingUser?.role === "CUSTOMER") {
      const customer = await this.db.client.customer.findFirst({ where: { userId: requestingUser.id } });
      if (!customer || customer.id !== sub.customerId) {
        throw new ForbiddenException("You can only pay for your own subscription.");
      }
    }

    await this.db.client.$transaction(async (tx: any) => {
      const result = await tx.customer.updateMany({
        where: { id: sub.customerId!, walletBalance: { gte: sub.totalPrice } },
        data: { walletBalance: { decrement: sub.totalPrice } },
      });
      if (result.count === 0) {
        throw new BadRequestException("Wallet balance is insufficient to cover this subscription in full.");
      }

      await tx.subscription.update({ where: { id }, data: { paymentStatus: PaymentState.PAID } });

      await tx.payment.create({
        data: {
          subscriptionId: id,
          customerId: sub.customerId!,
          amount: new Decimal(sub.totalPrice),
          method: PaymentMethod.WALLET,
          status: PaymentStatus.COMPLETED,
        },
      });
    });

    return this.findOne(id);
  }

  async remove(id: string): Promise<{ deletedOrders: number }> {
    await this.findOne(id);
    const deletedOrders = await this.db.client.order.count({ where: { subscriptionId: id } });
    await this.db.client.subscription.delete({ where: { id } });
    return { deletedOrders };
  }

  // Picks a sensible default flavor for a protein when auto-generating an
  // order's line items — smallest available portion size first, so
  // rounding to a whole number of packs loses the least precision against
  // the target gram allocation. Whoever's on the ground (admin, or the
  // customer later) can still edit the flavor/size on a not-yet-completed
  // Order before it actually goes out.
  private async pickDefaultMenuItem(protein: Protein) {
    return this.db.client.menuItem.findFirst({
      where: { protein, isAvailable: true },
      orderBy: [{ sizeGrams: "asc" }, { flavor: "asc" }],
    });
  }

  /**
   * Materializes real Order rows (source SUBSCRIPTION) for a subscription's
   * volume schedule, but only ones landing within the next
   * SYNC_HORIZON_DAYS — never the whole theoretical future. Safe to call
   * repeatedly (idempotent: it only ever looks at what's already on disk to
   * decide what's next), so it's called after create/top-up and can also be
   * triggered manually or from page loads elsewhere in the admin app to
   * keep the rolling window fresh.
   *
   * Allocation across multiple protein pools within one order is
   * proportional to how much of each protein is still *unscheduled*
   * (totalGrams minus whatever's already represented in existing,
   * non-cancelled Order rows) — deliberately NOT based on remainingGrams,
   * which only changes once an order's status is actually marked COMPLETED
   * (requirement: scheduling/postponing never touches balance).
   */
  async syncUpcomingOrders(subscriptionId?: string): Promise<{ created: number }> {
    const subs = await this.db.client.subscription.findMany({
      where: {
        status: "ACTIVE",
        ...(subscriptionId ? { id: subscriptionId } : {}),
      },
      include: {
        pools: true,
        customer: { select: { address: true } },
        orders: { include: { items: true } },
      },
    });

    let totalCreated = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = addDays(today, SYNC_HORIZON_DAYS);

    for (const sub of subs) {
      const scheduledByProtein: Record<string, number> = {};
      for (const order of sub.orders) {
        if (order.status === "CANCELLED") continue;
        for (const item of order.items) {
          scheduledByProtein[item.protein] = (scheduledByProtein[item.protein] ?? 0) + item.qty * item.sizeGrams;
        }
      }

      const unscheduledByProtein: Record<string, number> = {};
      for (const pool of sub.pools) {
        const already = scheduledByProtein[pool.protein] ?? 0;
        unscheduledByProtein[pool.protein] = Math.max(0, pool.totalGrams - already);
      }

      let lastDate =
        sub.orders.length > 0
          ? sub.orders.reduce((max: Date, o: any) => (o.deliveryDate > max ? o.deliveryDate : max), sub.orders[0].deliveryDate)
          : null;
      let nextDate = lastDate ? addDays(lastDate, sub.deliveryIntervalDays) : new Date(sub.startDate);

      let guard = 0;
      while (nextDate <= horizon && guard < MAX_ORDERS_PER_SYNC) {
        guard += 1;
        const totalUnscheduled = Object.values(unscheduledByProtein).reduce((s, g) => s + g, 0);
        if (totalUnscheduled <= 0) break;

        const targetGrams = Math.min(sub.deliveryAmountGrams, totalUnscheduled);
        const isLast = targetGrams >= totalUnscheduled;

        const itemsToCreate: {
          menuItemId: string;
          protein: Protein;
          flavor: string;
          sizeGrams: number;
          unitPrice: number;
          qty: number;
        }[] = [];

        for (const pool of sub.pools) {
          const unscheduled = unscheduledByProtein[pool.protein] ?? 0;
          if (unscheduled <= 0) continue;
          const share = totalUnscheduled > 0 ? unscheduled / totalUnscheduled : 0;
          let alloc = isLast ? unscheduled : Math.round(targetGrams * share);
          alloc = Math.min(alloc, unscheduled);
          if (alloc <= 0) continue;

          const menuItem = await this.pickDefaultMenuItem(pool.protein);
          if (!menuItem) continue;

          const qty = Math.max(1, Math.round(alloc / menuItem.sizeGrams));
          itemsToCreate.push({
            menuItemId: menuItem.id,
            protein: pool.protein,
            flavor: menuItem.flavor,
            sizeGrams: menuItem.sizeGrams,
            unitPrice: menuItem.price,
            qty,
          });
          unscheduledByProtein[pool.protein] = Math.max(0, unscheduled - qty * menuItem.sizeGrams);
        }

        if (itemsToCreate.length === 0) break;

        await this.ordersService.createFromSubscription({
          subscriptionId: sub.id,
          customerId: sub.customerId,
          customerName: sub.customerName,
          deliveryAddress: sub.customer?.address ?? undefined,
          deliveryDate: nextDate,
          items: itemsToCreate,
        });
        totalCreated += 1;
        lastDate = nextDate;
        nextDate = addDays(nextDate, sub.deliveryIntervalDays);
      }
    }

    return { created: totalCreated };
  }

  private mapSubscription(sub: {
    id: string;
    customerId: string | null;
    customerName: string;
    packageName: string;
    totalGrams: number;
    deliveryAmountGrams: number;
    deliveryIntervalDays: number;
    startDate: Date;
    totalPrice: number;
    paymentStatus: string;
    status: string;
    postponedCount: number;
    pools: Array<{
      id: string;
      subscriptionId: string;
      protein: string;
      totalGrams: number;
      remainingGrams: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }): Subscription {
    return {
      id: sub.id,
      customerId: sub.customerId ?? undefined,
      customerName: sub.customerName,
      packageName: sub.packageName,
      totalGrams: sub.totalGrams,
      deliveryAmountGrams: sub.deliveryAmountGrams,
      deliveryIntervalDays: sub.deliveryIntervalDays,
      startDate: sub.startDate,
      totalPrice: sub.totalPrice,
      paymentStatus: sub.paymentStatus as Subscription["paymentStatus"],
      status: sub.status as Subscription["status"],
      postponedCount: sub.postponedCount,
      pools: sub.pools.map(
        (p): SubscriptionPool => ({
          id: p.id,
          subscriptionId: p.subscriptionId,
          protein: p.protein as SubscriptionPool["protein"],
          totalGrams: p.totalGrams,
          remainingGrams: p.remainingGrams,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }),
      ),
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    };
  }

  async processRenewal(subscriptionId: string): Promise<void> {
    const subscription = await this.db.client.subscription.findUnique({
      where: { id: subscriptionId },
      include: { customer: true },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription ${subscriptionId} not found`);
    }

    if (subscription.status !== "ACTIVE") {
      throw new BadRequestException(`Subscription ${subscriptionId} is not active`);
    }

    // Use deliveryIntervalDays from the subscription itself
    const intervalDays = subscription.deliveryIntervalDays || 30;
    
    // Calculate next billing date based on start date and interval
    // For simplicity, use current date + interval
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + intervalDays);

    // Update subscription - we don't have nextBillingDate in schema, 
    // but we can track it via a custom field or just log it
    // For now, just log and sync upcoming orders
    await this.db.client.subscription.update({
      where: { id: subscriptionId },
      data: {
        // If we add nextBillingDate to schema later, we can update it here
        // For now, trigger order sync which will create upcoming orders
        updatedAt: new Date(),
      },
    });

    // Sync upcoming orders for this subscription (creates orders for next 7 days)
    await this.syncUpcomingOrders(subscriptionId);

    this.logger.log(`Processed renewal for subscription ${subscriptionId}, next billing in ${intervalDays} days`);
  }
}
