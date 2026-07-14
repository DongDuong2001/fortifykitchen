import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { SubscriptionPlansService } from "../service/subscription-plans.service";
import { RequestPlanUpgradeDto } from "../dto/request-plan-upgrade.dto";
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

  // Registered before ":id/purchase" — "my-upgrade-requests" and
  // "request-upgrade" are literal segments Nest matches exactly, but keeping
  // them ahead of the ":id" route avoids any ambiguity as routes are added.
  @Get("my-upgrade-requests")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get my own plan-upgrade request history" })
  async findMyUpgradeRequests(@CurrentUser() user: any) {
    return this.service.findMyUpgradeRequests(user.id);
  }

  @Post("request-upgrade")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Ask to move to a higher plan tier while a discount is still active" })
  @ApiResponse({ status: 201, description: "Request created with status PENDING, awaiting staff review." })
  async requestUpgrade(@Body() dto: RequestPlanUpgradeDto, @CurrentUser() user: any) {
    return this.service.requestUpgrade(user.id, dto.requestedPlanId, dto.notes);
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
