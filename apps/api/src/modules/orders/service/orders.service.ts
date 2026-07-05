import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { CreateOrderDto } from "../dto/create-order.dto";
import { UpdateOrderDto } from "../dto/update-order.dto";
import { calculateOrderTotal } from "@fortifykitchen/shared";
import { Order, OrderItem, LineItem } from "@fortifykitchen/types";
import { DeliveryStatus, PaymentState, OrderFulfillmentType, Prisma } from "@fortifykitchen/database";

@Injectable()
export class OrdersService {
  constructor(private readonly db: DatabaseService) {}

  // Looks up each menuItemId's current protein/flavor/size/price and builds
  // the LineItem[] shape the shared discount engine expects — the server
  // is the source of truth for pricing, never the client.
  private async buildLineItems(items: { menuItemId: string; qty: number }[]): Promise<LineItem[]> {
    const lineItems: LineItem[] = [];
    for (const { menuItemId, qty } of items) {
      const menuItem = await this.db.client.menuItem.findUnique({ where: { id: menuItemId } });
      if (!menuItem) {
        throw new BadRequestException(`Menu item ${menuItemId} not found`);
      }
      lineItems.push({
        menuItemId: menuItem.id,
        protein: menuItem.protein as LineItem["protein"],
        flavor: menuItem.flavor,
        sizeGrams: menuItem.sizeGrams,
        unitPrice: menuItem.price,
        qty,
      });
    }
    return lineItems;
  }

  // Whether every line item's menu item currently has enough stockQuantity
  // to cover the requested qty (same menuItemId appearing on more than one
  // line is summed first) — an order only qualifies as IMMEDIATE if ALL of
  // its items clear this bar; a single short item pushes the WHOLE order to
  // SCHEDULED rather than splitting it.
  private async resolveFulfillment(
    items: { menuItemId: string; qty: number }[],
  ): Promise<{ fulfillmentType: OrderFulfillmentType; requiredByMenuItem: Map<string, number> }> {
    const requiredByMenuItem = new Map<string, number>();
    for (const { menuItemId, qty } of items) {
      requiredByMenuItem.set(menuItemId, (requiredByMenuItem.get(menuItemId) ?? 0) + qty);
    }

    let allInStock = true;
    for (const [menuItemId, requiredQty] of requiredByMenuItem) {
      const menuItem = await this.db.client.menuItem.findUnique({ where: { id: menuItemId } });
      if (!menuItem || menuItem.stockQuantity < requiredQty) {
        allInStock = false;
        break;
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
  private async decrementStock(
    tx: Prisma.TransactionClient,
    requiredByMenuItem: Map<string, number>,
  ): Promise<void> {
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
  private async restockItems(
    tx: Prisma.TransactionClient,
    requiredByMenuItem: Map<string, number>,
  ): Promise<void> {
    for (const [menuItemId, qty] of requiredByMenuItem) {
      await tx.menuItem.updateMany({
        where: { id: menuItemId },
        data: { stockQuantity: { increment: qty } },
      });
    }
  }

  private requiredByMenuItemFromOrderItems(
    items: { menuItemId: string | null; qty: number }[],
  ): Map<string, number> {
    const map = new Map<string, number>();
    for (const item of items) {
      if (!item.menuItemId) continue; // menu item was deleted since — nothing to restock
      map.set(item.menuItemId, (map.get(item.menuItemId) ?? 0) + item.qty);
    }
    return map;
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    const customer = await this.db.client.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    const lineItems = await this.buildLineItems(dto.items);
    const pricing = calculateOrderTotal(lineItems);
    const { fulfillmentType, requiredByMenuItem } = await this.resolveFulfillment(dto.items);

    // IMMEDIATE orders are ready today, no scheduling needed — force the
    // delivery date to today regardless of what was submitted.
    const deliveryDate =
      fulfillmentType === OrderFulfillmentType.IMMEDIATE ? new Date() : new Date(dto.deliveryDate);

    const order = await this.db.client.$transaction(async (tx) => {
      if (fulfillmentType === OrderFulfillmentType.IMMEDIATE) {
        await this.decrementStock(tx, requiredByMenuItem);
      }

      return tx.order.create({
        data: {
          customerId: customer.id,
          customerName: customer.name,
          deliveryDate,
          paymentStatus: dto.paymentStatus ?? PaymentState.UNPAID,
          deliveryStatus: DeliveryStatus.SCHEDULED,
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
        include: { items: true },
      });
    });

    return this.mapOrder(order);
  }

  async findAll(): Promise<Order[]> {
    const orders = await this.db.client.order.findMany({
      include: { items: true },
      orderBy: { deliveryDate: "desc" },
    });
    return orders.map((o) => this.mapOrder(o));
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.db.client.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return this.mapOrder(order);
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
      for (const { menuItemId, qty } of dto.items) {
        requiredByMenuItem.set(menuItemId, (requiredByMenuItem.get(menuItemId) ?? 0) + qty);
      }
      let allInStock = true;
      for (const [menuItemId, requiredQty] of requiredByMenuItem) {
        const menuItem = await tx.menuItem.findUnique({ where: { id: menuItemId } });
        if (!menuItem || menuItem.stockQuantity < requiredQty) {
          allInStock = false;
          break;
        }
      }
      const fulfillmentType = allInStock
        ? OrderFulfillmentType.IMMEDIATE
        : OrderFulfillmentType.SCHEDULED;

      if (fulfillmentType === OrderFulfillmentType.IMMEDIATE) {
        await this.decrementStock(tx, requiredByMenuItem);
      }

      const deliveryDate =
        fulfillmentType === OrderFulfillmentType.IMMEDIATE ? new Date() : new Date(dto.deliveryDate);

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
        include: { items: true },
      });
    });

    return this.mapOrder(order);
  }

  // Cancelling an IMMEDIATE order frees its stock back up — but only once
  // (guarded by checking the previous status wasn't already CANCELLED), so
  // repeated no-op status updates can't double-restock.
  async updateDeliveryStatus(id: string, deliveryStatus: DeliveryStatus): Promise<Order> {
    const existing = await this.db.client.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const order = await this.db.client.$transaction(async (tx) => {
      if (
        deliveryStatus === DeliveryStatus.CANCELLED &&
        existing.deliveryStatus !== DeliveryStatus.CANCELLED &&
        existing.fulfillmentType === OrderFulfillmentType.IMMEDIATE
      ) {
        const required = this.requiredByMenuItemFromOrderItems(existing.items);
        await this.restockItems(tx, required);
      }

      return tx.order.update({
        where: { id },
        data: { deliveryStatus },
        include: { items: true },
      });
    });

    return this.mapOrder(order);
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentState): Promise<Order> {
    await this.findOne(id);
    const order = await this.db.client.order.update({
      where: { id },
      data: { paymentStatus },
      include: { items: true },
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
      if (
        existing.fulfillmentType === OrderFulfillmentType.IMMEDIATE &&
        existing.deliveryStatus !== DeliveryStatus.DELIVERED
      ) {
        const required = this.requiredByMenuItemFromOrderItems(existing.items);
        await this.restockItems(tx, required);
      }
      await tx.order.delete({ where: { id } });
    });
  }

  private mapOrder(order: {
    id: string;
    customerId: string | null;
    customerName: string;
    deliveryDate: Date;
    paymentStatus: string;
    deliveryStatus: string;
    fulfillmentType: string;
    subtotal: number;
    discountAmount: number;
    total: number;
    notes: string | null;
    items: Array<{
      id: string;
      orderId: string;
      menuItemId: string | null;
      protein: string;
      flavor: string;
      sizeGrams: number;
      unitPrice: number;
      qty: number;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }): Order {
    return {
      id: order.id,
      customerId: order.customerId ?? undefined,
      customerName: order.customerName,
      deliveryDate: order.deliveryDate,
      paymentStatus: order.paymentStatus as Order["paymentStatus"],
      deliveryStatus: order.deliveryStatus as Order["deliveryStatus"],
      fulfillmentType: order.fulfillmentType as Order["fulfillmentType"],
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      total: order.total,
      notes: order.notes ?? undefined,
      items: order.items.map(
        (i): OrderItem => ({
          id: i.id,
          orderId: i.orderId,
          menuItemId: i.menuItemId ?? undefined,
          protein: i.protein as OrderItem["protein"],
          flavor: i.flavor,
          sizeGrams: i.sizeGrams,
          unitPrice: i.unitPrice,
          qty: i.qty,
        }),
      ),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
