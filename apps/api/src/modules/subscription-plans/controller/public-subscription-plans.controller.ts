import { Controller, Get, Post, Param, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { SubscriptionPlansService } from "../service/subscription-plans.service";
import { SubscriptionPlan } from "@fortifykitchen/types";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

// Customer-facing: browse the plan catalog and buy a tier. Buying requires
// a logged-in account (decided: wallet actions need an account, unlike
// CustomPlanRequest submission which stays phone-only) — see
// docs/plan-and-credit-design.md.
@ApiTags("public-subscription-plans")
@Controller("subscription-plans/public")
export class PublicSubscriptionPlansController {
  constructor(private readonly service: SubscriptionPlansService) {}

  @Get()
  @ApiOperation({ summary: "List purchasable subscription plan tiers" })
  async findActive(): Promise<SubscriptionPlan[]> {
    return this.service.findActive();
  }

  @Post(":id/purchase")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Buy a plan tier — opens a PENDING payment for staff to reconcile against the bank transfer",
  })
  @ApiResponse({ status: 201, description: "Payment opened, status PENDING. Wallet is credited once staff confirm receipt." })
  async purchase(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.purchase(id, user.id);
  }
}
