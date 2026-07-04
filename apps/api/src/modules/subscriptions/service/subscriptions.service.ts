import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { CreateSubscriptionDto } from "../dto/create-subscription.dto";
import { SubscriptionStatus, SubscriptionFrequency } from "@fortifykitchen/types";
import { Decimal } from "@fortifykitchen/database";

@Injectable()
export class SubscriptionsService {
  constructor(private readonly db: DatabaseService) {}

  async create(userId: string, dto: CreateSubscriptionDto) {
    const customer = await this.db.client.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer profile not found for user ID ${userId}`);
    }

    const startDate = new Date(dto.startDate);
    const nextDeliveryDate = this.calculateNextDelivery(startDate, dto.frequency);

    const subscription = await this.db.client.subscription.create({
      data: {
        customerId: customer.id,
        status: "ACTIVE" as SubscriptionStatus,
        frequency: dto.frequency,
        startDate,
        nextDeliveryDate,
        pricePerCycle: new Decimal(dto.pricePerCycle),
      },
    });

    return this.mapSubscription(subscription);
  }

  async findAll() {
    const list = await this.db.client.subscription.findMany({
      include: { customer: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });
    return list.map(this.mapSubscriptionAdmin);
  }

  async findAllByUserId(userId: string) {
    const customer = await this.db.client.customer.findUnique({
      where: { userId },
    });
    if (!customer) return [];

    const list = await this.db.client.subscription.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
    });
    return list.map(this.mapSubscription);
  }

  async findOne(id: string) {
    const item = await this.db.client.subscription.findUnique({
      where: { id },
      include: { customer: { include: { user: true } } },
    });
    if (!item) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
    return this.mapSubscriptionAdmin(item);
  }

  async updateStatus(id: string, status: SubscriptionStatus) {
    const sub = await this.db.client.subscription.findUnique({ where: { id } });
    if (!sub) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    const updated = await this.db.client.subscription.update({
      where: { id },
      data: { status },
    });

    return this.mapSubscription(updated);
  }

  private calculateNextDelivery(start: Date, frequency: SubscriptionFrequency): Date {
    const next = new Date(start);
    if (frequency === "DAILY") {
      next.setDate(next.getDate() + 1);
    } else if (frequency === "WEEKLY") {
      next.setDate(next.getDate() + 7);
    } else if (frequency === "MONTHLY") {
      next.setMonth(next.getMonth() + 1);
    }
    return next;
  }

  private mapSubscription(sub: any): any {
    return {
      id: sub.id,
      customerId: sub.customerId,
      status: sub.status,
      frequency: sub.frequency,
      startDate: sub.startDate,
      endDate: sub.endDate,
      nextDeliveryDate: sub.nextDeliveryDate,
      pricePerCycle: Number(sub.pricePerCycle),
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    };
  }

  private mapSubscriptionAdmin = (sub: any): any => {
    return {
      ...this.mapSubscription(sub),
      customerName: sub.customer?.user
        ? `${sub.customer.user.firstName} ${sub.customer.user.lastName}`
        : undefined,
      customerPhone: sub.customer?.phone,
    };
  };
}
