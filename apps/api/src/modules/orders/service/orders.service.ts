import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { CreateOrderDto } from "../dto/create-order.dto";
import { UpdateOrderDto } from "../dto/update-order.dto";
import { calculateOrderTotal } from "@fortifykitchen/shared";
import { Order, OrderItem, LineItem } from "@fortifykitchen/types";
import { DeliveryStatus, PaymentState } from "@fortifykitchen/database";

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

  async create(dto: CreateOrderDto): Promise<Order> {
    const customer = await this.db.client.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    const lineItems = await this.buildLineItems(dto.items);
    const pricing = calculateOrderTotal(lineItems);

    const order = await this.db.client.order.create({
      data: {
        customerId: customer.id,
        customerName: customer.name,
        deliveryDate: new Date(dto.deliveryDate),
        paymentStatus: dto.paymentStatus ?? PaymentState.UNPAID,
        deliveryStatus: DeliveryStatus.SCHEDULED,
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
  // the single source of truth with no partial-update drift.
  async update(id: string, dto: UpdateOrderDto): Promise<Order> {
    await this.findOne(id);

    const customer = await this.db.client.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    const lineItems = await this.buildLineItems(dto.items);
    const pricing = calculateOrderTotal(lineItems);

    const order = await this.db.client.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      return tx.order.update({
        where: { id },
        data: {
          customerId: customer.id,
          customerName: customer.name,
          deliveryDate: new Date(dto.deliveryDate),
          paymentStatus: dto.paymentStatus ?? PaymentState.UNPAID,
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

  async updateDeliveryStatus(id: string, deliveryStatus: DeliveryStatus): Promise<Order> {
    await this.findOne(id);
    const order = await this.db.client.order.update({
      where: { id },
      data: { deliveryStatus },
      include: { items: true },
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

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.db.client.order.delete({ where: { id } });
  }

  private mapOrder(order: {
    id: string;
    customerId: string | null;
    customerName: string;
    deliveryDate: Date;
    paymentStatus: string;
    deliveryStatus: string;
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
