import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { SubscriptionsService } from "../../subscriptions/service/subscriptions.service";

@Injectable()
export class CronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CronService.name);
  private pingTimer: ReturnType<typeof globalThis.setInterval> | null = null;

  constructor(
    private readonly db: DatabaseService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  onModuleInit() {
    this.startKeepAlivePing();
  }

  onModuleDestroy() {
    if (this.pingTimer) {
      globalThis.clearInterval(this.pingTimer);
    }
  }

  private startKeepAlivePing() {
    const renderUrl =
      process.env.RENDER_EXTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://fortifykitchen-api.onrender.com";
    const targetUrl = `${renderUrl.replace(/\/$/, "")}/api/health`;

    // Internal keep-alive ping every 10 minutes to prevent Render free instance from sleeping
    this.pingTimer = globalThis.setInterval(async () => {
      try {
        const response = await globalThis.fetch(targetUrl);
        this.logger.log(`[KeepAlive] Self-ping to ${targetUrl} - Status: ${response.status}`);
      } catch (error) {
        this.logger.warn(
          `[KeepAlive] Self-ping to ${targetUrl} failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }, 10 * 60 * 1000); // 10 minutes
  }

  async processSubscriptionRenewals(cronJobName: string) {
    this.logger.log(`[${cronJobName}] Starting subscription renewal processing`);
    
    try {
      const subscriptions = await this.db.client.subscription.findMany({
        where: {
          status: "ACTIVE",
        },
        include: {
          customer: true,
          pools: true,
        },
      });

      this.logger.log(`[${cronJobName}] Found ${subscriptions.length} active subscriptions`);

      const results = {
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const subscription of subscriptions) {
        try {
          await this.subscriptionsService.syncUpcomingOrders(subscription.id);
          results.succeeded++;
        } catch (error) {
          results.failed++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          results.errors.push(`Subscription ${subscription.id}: ${errorMessage}`);
          this.logger.error(`[${cronJobName}] Failed to process subscription ${subscription.id}`, error instanceof Error ? error.stack : undefined);
        }
        results.processed++;
      }

      this.logger.log(`[${cronJobName}] Completed: ${results.succeeded} succeeded, ${results.failed} failed`);
      return results;
    } catch (error) {
      this.logger.error(`[${cronJobName}] Error processing renewals`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async syncSubscriptions(cronJobName: string) {
    this.logger.log(`[${cronJobName}] Starting subscription sync`);
    
    try {
      const subscriptions = await this.db.client.subscription.findMany({
        where: {
          status: { in: ["ACTIVE", "PAUSED"] },
        },
      });

      const synced = subscriptions.length;

      this.logger.log(`[${cronJobName}] Synced ${synced} subscriptions`);
      return { synced, timestamp: new Date().toISOString() };
    } catch (error) {
      this.logger.error(`[${cronJobName}] Error syncing subscriptions`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async cleanupExpiredSessions(cronJobName: string) {
    this.logger.log(`[${cronJobName}] Starting session cleanup`);
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      const result = await this.db.client.session.deleteMany({
        where: {
          expiresAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`[${cronJobName}] Deleted ${result.count} expired sessions`);
      return { deletedCount: result.count, timestamp: new Date().toISOString() };
    } catch (error) {
      this.logger.error(`[${cronJobName}] Error cleaning up sessions`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async cleanupOldOrders(cronJobName: string) {
    this.logger.log(`[${cronJobName}] Starting old orders cleanup`);
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);

      const result = await this.db.client.order.deleteMany({
        where: {
          status: { in: ["COMPLETED", "CANCELLED"] },
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`[${cronJobName}] Deleted ${result.count} old orders`);
      return { deletedCount: result.count, timestamp: new Date().toISOString() };
    } catch (error) {
      this.logger.error(`[${cronJobName}] Error cleaning up orders`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async syncAdminData(cronJobName: string) {
    this.logger.log(`[${cronJobName}] Starting admin data sync`);
    
    try {
      const stats = {
        totalOrders: await this.db.client.order.count(),
        activeSubscriptions: await this.db.client.subscription.count({ where: { status: "ACTIVE" } }),
        totalCustomers: await this.db.client.customer.count(),
        totalRevenue: await this.db.client.order.aggregate({
          where: { status: "COMPLETED" },
          _sum: { total: true },
        }),
      };

      this.logger.log(`[${cronJobName}] Admin sync completed`);
      return { ...stats, timestamp: new Date().toISOString() };
    } catch (error) {
      this.logger.error(`[${cronJobName}] Error syncing admin data`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}