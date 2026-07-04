import { Controller, Get, Post, Put, Body, Param, UseGuards, ParseUUIDPipe, ForbiddenException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { SubscriptionsService } from "../service/subscriptions.service";
import { CreateSubscriptionDto } from "../dto/create-subscription.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { SubscriptionStatus } from "@fortifykitchen/types";

@ApiTags("subscriptions")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @Roles("CUSTOMER")
  @ApiOperation({ summary: "Subscribe to a recurring meal plan" })
  @ApiResponse({ status: 201, description: "Subscription successfully created." })
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(user.id, dto);
  }

  @Get("me")
  @Roles("CUSTOMER")
  @ApiOperation({ summary: "Get current logged-in customer's subscriptions" })
  @ApiResponse({ status: 200, description: "Returns list of customer's active plans." })
  async findAllMySubscriptions(@CurrentUser() user: { id: string }) {
    return this.subscriptionsService.findAllByUserId(user.id);
  }

  @Get()
  @Roles("ADMIN", "MANAGER", "STAFF")
  @ApiOperation({ summary: "Get all customer subscriptions (Admin/Staff only)" })
  @ApiResponse({ status: 200, description: "Returns list of all subscriptions." })
  async findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get subscription details by ID" })
  @ApiResponse({ status: 200, description: "Returns full subscription schedule." })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  async findOne(@CurrentUser() user: { id: string; role: string }, @Param("id", ParseUUIDPipe) id: string) {
    const sub = await this.subscriptionsService.findOne(id);
    if (user.role === "CUSTOMER") {
      const mySubs = await this.subscriptionsService.findAllByUserId(user.id);
      const isMySub = mySubs.some((s) => s.id === id);
      if (!isMySub) {
        throw new ForbiddenException("You do not have permission to view this subscription");
      }
    }
    return sub;
  }

  @Put(":id/status")
  @ApiOperation({ summary: "Pause, activate, or cancel a subscription plan" })
  @ApiResponse({ status: 200, description: "Subscription status updated." })
  async updateStatus(
    @CurrentUser() user: { id: string; role: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Body("status") status: SubscriptionStatus,
  ) {
    // Check ownership if they are a customer
    if (user.role === "CUSTOMER") {
      const mySubs = await this.subscriptionsService.findAllByUserId(user.id);
      const isMySub = mySubs.some((s) => s.id === id);
      if (!isMySub) {
        throw new ForbiddenException("You do not have permission to manage this subscription");
      }
      // Customer can pause or cancel, but shouldn't be allowed to force expire it
      if (status !== "ACTIVE" && status !== "PAUSED" && status !== "CANCELLED") {
        throw new ForbiddenException("Invalid status option for customer self-management");
      }
    }
    return this.subscriptionsService.updateStatus(id, status);
  }
}
