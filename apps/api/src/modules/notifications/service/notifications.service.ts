import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { OrderSource, OrderStatus } from "@fortifykitchen/database";

// Two distinct low-balance checks, both in-app only (dashboard badge for
// staff, customer-web banner for the customer) — decided: both use the
// same "fewer than 3 typical orders/deliveries' worth remaining" shape.
// See docs/plan-and-credit-design.md's "Decisions log".
const LOOKAHEAD_OCCURRENCES = 3;
const ORDER_HISTORY_SAMPLE = 5; // how many recent one-off orders establish "typical" wallet spend

@Injectable()
export class NotificationsService {
  constructor(private readonly db: DatabaseService) {}

  // Any ACTIVE subscription's pool sitting under ~3 deliveries' worth of
  // grams. A pool doesn't track its own per-delivery size directly (only
  // the subscription-level deliveryAmountGrams, which spans every protein
  // on that subscription) — so a pool's share of one delivery is
  // approximated proportionally to how much of the subscription's total
  // purchased weight it represents, the same proportional-allocation logic
  // syncUpcomingOrders already uses to split one occurrence across pools.
  async getPoolsLow() {
    const pools = await this.db.client.subscriptionPool.findMany({
      where: { subscription: { status: "ACTIVE" } },
      include: { subscription: { select: { id: true, customerName: true, packageName: true, deliveryAmountGrams: true, totalGrams: true } } },
    });

    return pools
      .map((pool: any) => {
        const sub = pool.subscription;
        const share = sub.totalGrams > 0 ? pool.totalGrams / sub.totalGrams : 0;
        const perDeliveryGrams = sub.deliveryAmountGrams * share;
        const threshold = Math.round(perDeliveryGrams * LOOKAHEAD_OCCURRENCES);
        return {
          subscriptionId: sub.id,
          customerName: sub.customerName,
          packageName: sub.packageName,
          protein: pool.protein,
          remainingGrams: pool.remainingGrams,
          threshold,
        };
      })
      .filter((p: any) => p.threshold > 0 && p.remainingGrams < p.threshold);
  }

  // Customers whose walletBalance is under ~3 typical one-off orders' worth.
  // "Typical" is the average of their last few one-off orders — a customer
  // with no one-off order history yet has nothing to compare against, so
  // they're skipped rather than flagged on a guess.
  async getWalletsLow() {
    // Only customers who've actually engaged with the wallet (topped up at
    // least once) are worth watching — flagging a $0 balance for someone
    // who's never bought a plan would just be noise. Payment.customerId is
    // a plain id, not a Prisma relation (see schema.prisma), so this is a
    // two-step lookup rather than a nested `where`.
    const topUps = await this.db.client.payment.findMany({
      where: { subscriptionPlanId: { not: null }, customerId: { not: null } },
      select: { customerId: true },
      distinct: ["customerId"],
    });
    const walletCustomerIds = topUps.map((p: any) => p.customerId).filter((id: any): id is string => !!id);
    if (walletCustomerIds.length === 0) return [];

    const walletCustomers = await this.db.client.customer.findMany({
      where: { id: { in: walletCustomerIds } },
      select: { id: true, name: true, walletBalance: true },
    });

    const results: { customerId: string; customerName: string; walletBalance: number; threshold: number }[] = [];
    for (const customer of walletCustomers) {
      const recentOrders = await this.db.client.order.findMany({
        where: { customerId: customer.id, source: OrderSource.ONE_OFF, status: { not: OrderStatus.CANCELLED } },
        orderBy: { createdAt: "desc" },
        take: ORDER_HISTORY_SAMPLE,
        select: { total: true },
      });
      if (recentOrders.length === 0) continue;

      const avgOrderTotal = recentOrders.reduce((sum: number, o: any) => sum + o.total, 0) / recentOrders.length;
      const threshold = Math.round(avgOrderTotal * LOOKAHEAD_OCCURRENCES);
      if (threshold > 0 && customer.walletBalance < threshold) {
        results.push({ customerId: customer.id, customerName: customer.name, walletBalance: customer.walletBalance, threshold });
      }
    }
    return results;
  }

  // Combined admin view — powers the dashboard badge.
  async getLowBalanceSummary() {
    const [poolsLow, walletsLow] = await Promise.all([this.getPoolsLow(), this.getWalletsLow()]);
    return {
      poolsLow,
      walletsLow,
      totalCount: poolsLow.length + walletsLow.length,
    };
  }

  // Customer-facing view — powers the customer-web banner for whoever's
  // currently logged in.
  async getForUser(userId: string) {
    const customer = await this.db.client.customer.findFirst({ where: { userId } });
    if (!customer) {
      return { walletBalance: 0, walletLow: false, poolsLow: [] as Awaited<ReturnType<NotificationsService["getPoolsLow"]>> };
    }

    const [walletsLow, allPoolsLow] = await Promise.all([this.getWalletsLow(), this.getPoolsLow()]);
    const walletFlag = walletsLow.find((w: any) => w.customerId === customer.id);

    const subs = await this.db.client.subscription.findMany({ where: { customerId: customer.id }, select: { id: true } });
    const subIds = new Set(subs.map((s: any) => s.id));
    const poolsLow = allPoolsLow.filter((p: any) => subIds.has(p.subscriptionId));

    return {
      walletBalance: customer.walletBalance,
      walletLow: !!walletFlag,
      walletThreshold: walletFlag?.threshold,
      poolsLow,
    };
  }
}
