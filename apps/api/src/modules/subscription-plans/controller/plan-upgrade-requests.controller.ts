import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SubscriptionPlansService } from "../service/subscription-plans.service";
import { DeclinePlanUpgradeDto } from "../dto/decline-plan-upgrade.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";

// Staff review queue for customer-submitted plan-upgrade requests. Approving
// one only opens a PENDING Payment for the new tier — the same
// subscription-plan-purchases confirm/reject queue then handles the actual
// wallet credit once the bank transfer lands. See SubscriptionPlansService.
@ApiTags("plan-upgrade-requests")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "MANAGER", "STAFF")
@ApiBearerAuth("JWT-auth")
@Controller("plan-upgrade-requests")
export class PlanUpgradeRequestsController {
  constructor(private readonly service: SubscriptionPlansService) {}

  @Get("pending")
  @ApiOperation({ summary: "List upgrade requests still awaiting staff review" })
  async findPending() {
    return this.service.findPendingUpgradeRequests();
  }

  @Post(":id/approve")
  @Roles("ADMIN", "MANAGER")
  @ApiOperation({ summary: "Approve — opens a PENDING payment for the requested tier" })
  async approve(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.approveUpgradeRequest(id);
  }

  @Post(":id/decline")
  @Roles("ADMIN", "MANAGER")
  @ApiOperation({ summary: "Decline the upgrade request" })
  async decline(@Param("id", ParseUUIDPipe) id: string, @Body() dto: DeclinePlanUpgradeDto) {
    return this.service.declineUpgradeRequest(id, dto.adminNotes);
  }
}
