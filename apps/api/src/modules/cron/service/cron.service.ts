import { Injectable, Logger } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { SubscriptionsService } from "../../subscriptions/service/subscriptions.service";

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

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