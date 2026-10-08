import { Controller, Post, Get, UseGuards, Req, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CronService } from "../service/cron.service";
import { CronAuthGuard } from "../guards/cron-auth.guard";

@ApiTags("Cron Jobs")
@ApiBearerAuth("cron-secret")
@Controller("api/cron")
@UseGuards(CronAuthGuard)
export class CronController {
  constructor(private readonly cronService: CronService) {}

  @Post("subscriptions/renew")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Process subscription renewals (called by cron job)" })
  @ApiResponse({ status: 200, description: "Subscription renewals processed" })
  @ApiResponse({ status: 401, description: "Invalid cron secret" })
  async processSubscriptionRenewals(@Req() req: any) {
    return this.cronService.processSubscriptionRenewals(req.cronJobName);
  }

  @Post("subscriptions/sync")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Sync subscription statuses (called by cron job)" })
  @ApiResponse({ status: 200, description: "Subscription sync completed" })
  async syncSubscriptions(@Req() req: any) {
    return this.cronService.syncSubscriptions(req.cronJobName);
  }

  @Post("sessions/cleanup")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Clean up expired sessions (called by cron job)" })
  @ApiResponse({ status: 200, description: "Expired sessions cleaned up" })
  async cleanupExpiredSessions(@Req() req: any) {
    return this.cronService.cleanupExpiredSessions(req.cronJobName);
  }

  @Post("orders/cleanup")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Clean up old completed/cancelled orders (called by cron job)" })
  @ApiResponse({ status: 200, description: "Old orders cleaned up" })
  async cleanupOldOrders(@Req() req: any) {
    return this.cronService.cleanupOldOrders(req.cronJobName);
  }

  @Post("admin/sync")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Sync admin dashboard data (called by cron job)" })
  @ApiResponse({ status: 200, description: "Admin data sync completed" })
  async syncAdminData(@Req() req: any) {
    return this.cronService.syncAdminData(req.cronJobName);
  }

  @Get("health")
  @ApiOperation({ summary: "Health check endpoint for cron jobs" })
  @ApiResponse({ status: 200, description: "Cron service is healthy" })
  async healthCheck() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "cron",
    };
  }
}