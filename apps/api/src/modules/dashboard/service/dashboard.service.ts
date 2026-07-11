import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { PaymentState } from "@fortifykitchen/database";

@Injectable()
export class DashboardService {
  constructor(private readonly db: DatabaseService) {}

  async getStats() {
    const totalCustomers = await this.db.client.customer.count();

    const activeSubscriptions = await this.db.client.subscription.count({
      where: { status: "ACTIVE" },
    });

    const totalOrders = await this.db.client.order.count();

    // Revenue = paid orders + paid subscriptions. There's no separate
    // Payment ledger in the current flow — paymentStatus lives directly on
    // Order/Subscription (see schema.prisma's PaymentState comment).
    const [paidOrders, paidSubscriptions] = await Promise.all([
      this.db.client.order.findMany({
        where: { paymentStatus: PaymentState.PAID },
        select: { total: true },
      }),
      this.db.client.subscription.findMany({
        where: { paymentStatus: PaymentState.PAID },
        select: { totalPrice: true },
      }),
    ]);
    const totalRevenue =
      paidOrders.reduce((sum, o) => sum + o.total, 0) +
      paidSubscriptions.reduce((sum, s) => sum + s.totalPrice, 0);

    const recentOrdersRaw = await this.db.client.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    const recentOrders = recentOrdersRaw.map((o) => ({
      id: o.id,
      customerName: o.customerName,
      total: o.total,
      status: o.status,
      paymentStatus: o.paymentStatus,
      deliveryDate: o.deliveryDate,
      createdAt: o.createdAt,
      fulfillmentType: o.fulfillmentType,
      source: o.source,
    }));

    // Orders due in the next 7 days (subscription-sourced + one-off
    // combined — they're the same table now) that are still in flight —
    // matches the original dashboard's reorder alerts.
    const today = new Date();
    const in7Days = new Date(Date.now() + 7 * 86_400_000);
    const deliveriesThisWeek = await this.db.client.order.count({
      where: {
        deliveryDate: { gte: today, lte: in7Days },
        status: { in: ["PENDING_CONFIRMATION", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"] },
      },
    });

    const unpaidOrders = await this.db.client.order.count({
      where: { paymentStatus: { not: PaymentState.PAID } },
    });

    // Order-workflow stats (Chờ xác nhận -> Đang chuẩn bị -> Hoàn thành) —
    // surfaced so staff can see how much is waiting on them right now
    // without opening the Orders tab first.
    const [ordersAwaitingAcceptance, ordersInPreparation, ordersCancelledToday] = await Promise.all([
      this.db.client.order.count({ where: { status: "PENDING_CONFIRMATION" } }),
      this.db.client.order.count({ where: { status: { in: ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"] } } }),
      this.db.client.order.count({
        where: { status: "CANCELLED", updatedAt: { gte: today } },
      }),
    ]);

    // Inventory alerts — low/out-of-stock dishes, so a zero-stock item never
    // silently sits invisible to staff until a customer complains.
    const LOW_STOCK_THRESHOLD = 5;
    const allMenuItems = await this.db.client.menuItem.findMany({
      select: { id: true, protein: true, flavor: true, sizeGrams: true, stockQuantity: true },
    });
    const outOfStockItems = allMenuItems.filter((m) => m.stockQuantity <= 0).slice(0, 8);
    const lowStockItems = allMenuItems
      .filter((m) => m.stockQuantity > 0 && m.stockQuantity <= LOW_STOCK_THRESHOLD)
      .slice(0, 8);
    const dishesReadyNow = allMenuItems.filter((m) => m.stockQuantity > 0).length;

    // Volume-subscription specific stats.
    const activePools = await this.db.client.subscriptionPool.findMany({
      where: { subscription: { status: "ACTIVE" } },
      select: { subscriptionId: true, protein: true, totalGrams: true, remainingGrams: true },
    });
    const outstandingVolumeGrams = activePools.reduce((sum, p) => sum + p.remainingGrams, 0);

    // "Nearing depletion" = an active subscription where every pool has
    // <=10% of its purchased weight left (i.e. about to need a top-up or
    // wind down) — surfaced so staff can proactively reach out.
    const poolsBySubscription = new Map<string, typeof activePools>();
    for (const pool of activePools) {
      if (!poolsBySubscription.has(pool.subscriptionId)) poolsBySubscription.set(pool.subscriptionId, []);
      poolsBySubscription.get(pool.subscriptionId)!.push(pool);
    }
    let subscriptionsNearingDepletion = 0;
    for (const pools of poolsBySubscription.values()) {
      const allLow = pools.every((p) => p.totalGrams === 0 || p.remainingGrams / p.totalGrams <= 0.1);
      if (allLow) subscriptionsNearingDepletion += 1;
    }

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const completedThisMonth = await this.db.client.order.findMany({
      where: { source: "SUBSCRIPTION", status: "COMPLETED", updatedAt: { gte: startOfMonth } },
      include: { items: true },
    });
    const gramsDeliveredThisMonth = completedThisMonth.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.qty * i.sizeGrams, 0),
      0,
    );

    return {
      totalCustomers,
      activeSubscriptions,
      totalOrders,
      totalRevenue,
      deliveriesThisWeek,
      unpaidOrders,
      recentOrders,
      outstandingVolumeGrams,
      subscriptionsNearingDepletion,
      gramsDeliveredThisMonth,
      ordersAwaitingAcceptance,
      ordersInPreparation,
      ordersCancelledToday,
      outOfStockItems,
      lowStockItems,
      dishesReadyNow,
    };
  }
}
