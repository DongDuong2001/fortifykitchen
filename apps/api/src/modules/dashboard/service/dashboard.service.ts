import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";

@Injectable()
export class DashboardService {
  constructor(private readonly db: DatabaseService) {}

  async getStats() {
    // 1. Total Customers
    const totalCustomers = await this.db.client.customer.count();

    // 2. Active Subscriptions
    const activeSubscriptions = await this.db.client.subscription.count({
      where: { status: "ACTIVE" },
    });

    // 3. Total Orders
    const totalOrders = await this.db.client.order.count();

    // 4. Total Revenue (sum of completed payments)
    const completedPayments = await this.db.client.payment.findMany({
      where: { status: "COMPLETED" },
      select: { amount: true },
    });
    const totalRevenue = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // 5. Recent Orders
    const recentOrdersRaw = await this.db.client.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { include: { user: true } },
      },
    });

    const recentOrders = recentOrdersRaw.map((o) => ({
      id: o.id,
      customerName: o.customer?.user ? `${o.customer.user.firstName} ${o.customer.user.lastName}` : "Unknown",
      totalAmount: Number(o.totalAmount),
      status: o.status,
      createdAt: o.createdAt,
    }));

    return {
      totalCustomers,
      activeSubscriptions,
      totalOrders,
      totalRevenue,
      recentOrders,
    };
  }
}
