import { Controller, Get, Post, Param, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { SubscriptionPlansService } from "../service/subscription-plans.service";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";

// Staff reconciliation queue for wallet top-ups. Kept as its own top-level
// path (not nested under /subscription-plans/:id/...) so it can never
// collide with SubscriptionPlansController's ":id" routes. Confirming is
// the ONLY moment a customer's walletBalance actually changes — buying a
// plan just opens a PENDING Payment (decided: manual bank-transfer top-up,
// not instant/automatic). See docs/plan-and-credit-design.md.
@ApiTags("subscription-plan-purchases")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "MANAGER", "STAFF")
@ApiBearerAuth("JWT-auth")
@Controller("subscription-plan-purchases")
export class SubscriptionPlanPurchasesController {
  constructor(private readonly service: SubscriptionPlansService) {}

  @Get("pending")
  @ApiOperation({ summary: "List plan purchases still waiting on a bank transfer to be reconciled" })
  async findPending() {
    return this.service.findPendingPurchases();
  }

  @Post(":id/confirm")
  @Roles("ADMIN", "MANAGER")
  @ApiOperation({ summary: "Confirm the transfer arrived — credits the wallet and issues the tier's voucher" })
  @ApiResponse({ status: 200, description: "Wallet credited, voucher issued if the tier grants one." })
  async confirm(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.confirmPurchase(id);
  }

  @Post(":id/reject")
  @Roles("ADMIN", "MANAGER")
  @ApiOperation({ summary: "Reject a pending purchase (wrong/missing transfer) — no wallet credit, no voucher" })
  async reject(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.rejectPurchase(id);
  }
}
