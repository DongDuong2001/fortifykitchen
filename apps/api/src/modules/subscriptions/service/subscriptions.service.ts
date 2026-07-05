import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { CreateSubscriptionDto } from "../dto/create-subscription.dto";
import { UpdateSubscriptionDto } from "../dto/update-subscription.dto";
import { TopUpPoolDto } from "../dto/top-up-pool.dto";
import { calculatePoolPricing, addDays } from "@fortifykitchen/shared";
import { Subscription, SubscriptionPool } from "@fortifykitchen/types";
import { PaymentState, Protein } from "@fortifykitchen/database";

// How far ahead of "today" a subscription's Delivery rows get materialized.
// See syncUpcomingDeliveries — this is what makes requirement #2's "added 1
// week before the delivery for easier management" true: we don't create
// every future occurrence at subscription creation time, only a rolling
// window, called again whenever the sync endpoint is hit (creation, and
// opportunistically from the admin Deliveries/Dashboard pages).
const SYNC_HORIZON_DAYS = 7;
const MAX_DELIVERIES_PER_SYNC = 60; // safety guard against runaway generation

@Injectable()
export class SubscriptionsService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateSubscriptionDto): Promise<Subscription> {
    const customer = await this.db.client.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    // Merge duplicate protein entries the client might send, so "CHICKEN
    // 10kg" + "CHICKEN 20kg" in one payload becomes a single 30kg pool.
    const poolTotals = new Map<Protein, number>();
    for (const p of dto.pools) {
      poolTotals.set(p.protein, (poolTotals.get(p.protein) ?? 0) + p.totalGrams);
    }
    const pools = Array.from(poolTotals.entries()).map(([protein, totalGrams]) => ({ protein, totalGrams }));
    const totalGrams = pools.reduce((sum, p) => sum + p.totalGrams, 0);

    const availableMenuItems = await this.db.client.menuItem.findMany({
      where: { isAvailable: true, protein: { in: pools.map((p) => p.protein) } },
      select: { protein: true, price: true, sizeGrams: true },
    });

    const pricing = calculatePoolPricing(pools, availableMenuItems);
    if (pricing.missingProteins.length > 0) {
      throw new BadRequestException(
        `Không có món nào khả dụng cho: ${pricing.missingProteins.join(", ")} — vui lòng thêm món trong Thực đơn trước khi bán theo cân nặng cho protein này.`,
      );
    }
    const totalPrice = dto.totalPrice ?? Math.round(pricing.finalTotal);

    const subscription = await this.db.client.subscription.create({
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
      include: { pools: true, deliveries: { include: { items: true } } },
    });

    // Bootstrap the first week's worth of deliveries immediately so a
    // subscription starting today/tomorrow shows up in Prep List right away.
    await this.syncUpcomingDeliveries(subscription.id);

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
    return list.map((s) => this.mapSubscription(s));
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

  async findDeliveries(id: string) {
    await this.findOne(id);
    const deliveries = await this.db.client.delivery.findMany({
      where: { subscriptionId: id },
      include: { items: true },
      orderBy: { scheduledDate: "asc" },
    });
    return deliveries;
  }

  async findForCustomer(customerId: string): Promise<Subscription[]> {
    const list = await this.db.client.subscription.findMany({
      where: { customerId },
      include: { pools: true },
      orderBy: { startDate: "desc" },
    });
    return list.map((s) => this.mapSubscription(s));
  }

  // Phone-based lookup for the customer-web self-service view — there's no
  // customer login system in this product yet, so a phone number (which
  // staff already collect on every Customer record) stands in as the
  // identity check for read-only balance viewing and postponing a delivery.
  async findForPhone(phone: string): Promise<Subscription[]> {
    const customer = await this.db.client.customer.findFirst({ where: { phone } });
    if (!customer) return [];
    return this.findForCustomer(customer.id);
  }

  // Verifies a delivery actually belongs to a subscription owned by the
  // customer with this phone number, before allowing the public postpone
  // action — prevents anyone from postponing an arbitrary delivery id.
  async verifyDeliveryOwnership(deliveryId: string, phone: string): Promise<boolean> {
    const delivery = await this.db.client.delivery.findUnique({
      where: { id: deliveryId },
      include: { subscription: { include: { customer: true } } },
    });
    return !!delivery && delivery.subscription.customer?.phone === phone;
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

    const existingPool = sub.pools.find((p) => p.protein === dto.protein);
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
    await this.syncUpcomingDeliveries(id);

    return this.findOne(id);
  }

  async remove(id: string): Promise<{ deletedDeliveries: number }> {
    await this.findOne(id);
    const deletedDeliveries = await this.db.client.delivery.count({ where: { subscriptionId: id } });
    await this.db.client.subscription.delete({ where: { id } });
    return { deletedDeliveries };
  }

  // Picks a sensible default flavor for a protein when auto-generating a
  // delivery's line items — smallest available portion size first, so
  // rounding to a whole number of packs loses the least precision against
  // the target gram allocation. Whoever's on the ground (admin, or the
  // customer later) can still edit the flavor/size on a not-yet-delivered
  // Delivery before it actually goes out.
  private async pickDefaultMenuItem(protein: Protein) {
    return this.db.client.menuItem.findFirst({
      where: { protein, isAvailable: true },
      orderBy: [{ sizeGrams: "asc" }, { flavor: "asc" }],
    });
  }

  /**
   * Materializes real Delivery rows for a subscription's volume schedule,
   * but only ones landing within the next SYNC_HORIZON_DAYS — never the
   * whole theoretical future. Safe to call repeatedly (idempotent: it only
   * ever looks at what's already on disk to decide what's next), so it's
   * called after create/top-up and can also be triggered manually or from
   * page loads elsewhere in the admin app to keep the rolling window fresh.
   *
   * Allocation across multiple protein pools within one delivery is
   * proportional to how much of each protein is still *unscheduled*
   * (totalGrams minus whatever's already represented in existing,
   * non-cancelled Delivery rows) — deliberately NOT based on
   * remainingGrams, which only changes once a delivery is actually marked
   * DELIVERED (requirement: postponing/scheduling never touches balance).
   */
  async syncUpcomingDeliveries(subscriptionId?: string): Promise<{ created: number }> {
    const subs = await this.db.client.subscription.findMany({
      where: {
        status: "ACTIVE",
        ...(subscriptionId ? { id: subscriptionId } : {}),
      },
      include: {
        pools: true,
        deliveries: { include: { items: true } },
      },
    });

    let totalCreated = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = addDays(today, SYNC_HORIZON_DAYS);

    for (const sub of subs) {
      const scheduledByProtein: Record<string, number> = {};
      for (const delivery of sub.deliveries) {
        if (delivery.status === "CANCELLED") continue;
        for (const item of delivery.items) {
          scheduledByProtein[item.protein] = (scheduledByProtein[item.protein] ?? 0) + item.qty * item.sizeGrams;
        }
      }

      const unscheduledByProtein: Record<string, number> = {};
      for (const pool of sub.pools) {
        const already = scheduledByProtein[pool.protein] ?? 0;
        unscheduledByProtein[pool.protein] = Math.max(0, pool.totalGrams - already);
      }

      let lastDate =
        sub.deliveries.length > 0
          ? sub.deliveries.reduce((max, d) => (d.scheduledDate > max ? d.scheduledDate : max), sub.deliveries[0].scheduledDate)
          : null;
      let nextDate = lastDate ? addDays(lastDate, sub.deliveryIntervalDays) : new Date(sub.startDate);

      let guard = 0;
      while (nextDate <= horizon && guard < MAX_DELIVERIES_PER_SYNC) {
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

        await this.db.client.delivery.create({
          data: {
            subscriptionId: sub.id,
            scheduledDate: nextDate,
            status: "SCHEDULED",
            items: { create: itemsToCreate },
          },
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
}
