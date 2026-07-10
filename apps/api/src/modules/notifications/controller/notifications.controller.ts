import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { NotificationsService } from "../service/notifications.service";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

// In-app low-balance notifications — wallet balance low, or a Subscription
// pool running low. No email/SMS/Zalo this round (decided). See
// docs/plan-and-credit-design.md.
@ApiTags("notifications")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get("low-balance")
  @Roles("ADMIN", "MANAGER", "STAFF")
  @ApiOperation({ summary: "Staff-wide low-balance summary — powers the admin dashboard badge" })
  async lowBalance() {
    return this.service.getLowBalanceSummary();
  }

  @Get("me")
  @Roles("ADMIN", "MANAGER", "STAFF", "CUSTOMER")
  @ApiOperation({ summary: "Current customer's own low-balance flags — powers the customer-web banner" })
  async me(@CurrentUser() user: any) {
    return this.service.getForUser(user.id);
  }
}
