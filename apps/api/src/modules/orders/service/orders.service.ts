import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { CreateOrderDto } from "../dto/create-order.dto";
import { OrderStatus, PaymentStatus } from "@fortifykitchen/types";
import { Decimal } from "@fortifykitchen/database";

@Injectable()
export class OrdersService {
  constructor(private readonly db: DatabaseService) {}

  async create(userId: string, dto: CreateOrderDto) {
    // 1. Find Customer
    const customer = await this.db.client.customer.findUnique({
      where: { userId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer profile not found for user ID ${userId}`);
    }

    // 2. Fetch Menu Items and Calculate Prices
    let subtotal = 0;
    const itemsWithPrice: { menuItemId: string; quantity: number; price: Decimal; notes?: string }[] = [];

    for (const itemDto of dto.items) {
      const menuItem = await this.db.client.menuItem.findUnique({
        where: { id: itemDto.menuItemId },
      });
      if (!menuItem || !menuItem.isAvailable) {
        throw new BadRequestException(`Menu item ${itemDto.menuItemId} is not available`);
      }

      const price = Number(menuItem.price);
      subtotal += price * itemDto.quantity;

      itemsWithPrice.push({
        menuItemId: menuItem.id,
        quantity: itemDto.quantity,
        price: menuItem.price, // Decimal
        notes: itemDto.notes,
      });
    }

    // 3. Handle Discount Code if provided
    let discountAmount = 0;
    if (dto.discountCode) {
      const discount = await this.db.client.discount.findUnique({
        where: { code: dto.discountCode.toUpperCase() },
      });

      if (discount && discount.isActive && new Date() >= discount.startsAt && new Date() <= discount.endsAt) {
        const amt = Number(discount.amount);
        if (discount.type === "PERCENTAGE") {
          discountAmount = (subtotal * amt) / 100;
        } else {
          discountAmount = amt;
        }
      }
    }

    const deliveryFee = 30000; // 30,000 VND standard delivery fee in Vietnam
    const totalAmount = Math.max(0, subtotal - discountAmount + deliveryFee);

    // 4. Create in Transaction
    const order = await this.db.client.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerId: customer.id,
          status: "PENDING",
          totalAmount: new Decimal(totalAmount),
          deliveryAddress: dto.deliveryAddress,
          deliveryFee: new Decimal(deliveryFee),
          notes: dto.notes,
          items: {
            create: itemsWithPrice.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: item.price,
              notes: item.notes,
            })),
          },
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      // Create initial Payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          amount: new Decimal(totalAmount),
          method: dto.paymentMethod,
          status: "PENDING",
        },
      });

      // Create Delivery tracker
      await tx.delivery.create({
        data: {
          orderId: newOrder.id,
          status: "PENDING",
          estimatedTime: new Date(Date.now() + 45 * 60 * 1000), // Estimated 45 minutes from now
        },
      });

      return newOrder;
    });

    return this.mapOrder(order);
  }

  async findAll(): Promise<any[]> {
    const orders = await this.db.client.order.findMany({
      include: {
        items: { include: { menuItem: true } },
        payments: true,
        delivery: true,
        customer: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return orders.map(this.mapOrderAdmin);
  }

  async findAllByUserId(userId: string): Promise<any[]> {
    const customer = await this.db.client.customer.findUnique({
      where: { userId },
    });
    if (!customer) return [];

    const orders = await this.db.client.order.findMany({
      where: { customerId: customer.id },
      include: {
        items: { include: { menuItem: true } },
        payments: true,
        delivery: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map(this.mapOrder);
  }

  async findOne(id: string): Promise<any> {
    const order = await this.db.client.order.findUnique({
      where: { id },
      include: {
        items: { include: { menuItem: true } },
        payments: true,
        delivery: true,
        customer: { include: { user: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return this.mapOrderAdmin(order);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<any> {
    const order = await this.db.client.order.findUnique({
      where: { id },
      include: { payments: true, delivery: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return this.db.client.$transaction(async (tx) => {
      // 1. Update Order Status
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status },
        include: {
          items: { include: { menuItem: true } },
          payments: true,
          delivery: true,
          customer: { include: { user: true } },
        },
      });

      // 2. Update Delivery tracker status
      if (updatedOrder.delivery) {
        await tx.delivery.update({
          where: { orderId: id },
          data: {
            status,
            actualTime: status === "DELIVERED" ? new Date() : undefined,
          },
        });
      }

      // 3. For CASH_ON_DELIVERY: If order status changes to DELIVERED, automatically change payment status to COMPLETED
      const codPayment = updatedOrder.payments.find((p) => p.method === ("CASH_ON_DELIVERY" as any));
      if (status === "DELIVERED" && codPayment && codPayment.status === "PENDING") {
        await tx.payment.update({
          where: { id: codPayment.id },
          data: { status: "COMPLETED" as PaymentStatus },
        });
      }

      // Re-fetch updated payments
      const finalPayments = await tx.payment.findMany({ where: { orderId: id } });
      const finalDelivery = await tx.delivery.findUnique({ where: { orderId: id } });

      return this.mapOrderAdmin({
        ...updatedOrder,
        payments: finalPayments,
        delivery: finalDelivery,
      });
    });
  }

  private mapOrder(order: any): any {
    return {
      id: order.id,
      customerId: order.customerId,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      deliveryAddress: order.deliveryAddress,
      deliveryFee: Number(order.deliveryFee),
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((i: any) => ({
        id: i.id,
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        price: Number(i.price),
        notes: i.notes,
        menuItem: i.menuItem ? { ...i.menuItem, price: Number(i.menuItem.price) } : undefined,
      })),
      payment: order.payments?.[0]
        ? {
            id: order.payments[0].id,
            amount: Number(order.payments[0].amount),
            method: order.payments[0].method,
            status: order.payments[0].status,
            transactionId: order.payments[0].transactionId,
          }
        : undefined,
      delivery: order.delivery
        ? {
            id: order.delivery.id,
            status: order.delivery.status,
            estimatedTime: order.delivery.estimatedTime,
            actualTime: order.delivery.actualTime,
          }
        : undefined,
    };
  }

  private mapOrderAdmin = (order: any): any => {
    return {
      ...this.mapOrder(order),
      customerName: order.customer?.user
        ? `${order.customer.user.firstName} ${order.customer.user.lastName}`
        : undefined,
      customerPhone: order.customer?.phone,
    };
  };
}
