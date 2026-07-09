import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { SubscriptionsService } from "../service/subscriptions.service";
import { CreateSubscriptionDto } from "../dto/create-subscription.dto";
import { UpdateSubscriptionDto } from "../dto/update-subscription.dto";
import { TopUpPoolDto } from "../dto/top-up-pool.dto";
import { Subscription } from "@fortifykitchen/types";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

// Subscriptions are staff-created or customer viewed.
@ApiTags("subscriptions")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "MANAGER", "STAFF")
@ApiBearerAuth("JWT-auth")
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: "Get all subscriptions, each with its protein pool balances" })
  @ApiResponse({ status: 200, description: "Returns list of all subscriptions." })
  async findAll(): Promise<Subscription[]> {
    return this.subscriptionsService.findAll();
  }

  @Get("me")
  @Roles("ADMIN", "MANAGER", "STAFF", "CUSTOMER")
  @ApiOperation({ summary: "Get current customer's subscription history" })
  @ApiResponse({ status: 200, description: "Returns own subscriptions." })
  async findMe(@CurrentUser() user: any): Promise<Subscription[]> {
    return this.subscriptionsService.findForUser(user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get subscription details, including protein pool balances" })
  @ApiResponse({ status: 200, description: "Returns subscription details." })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<Subscription> {
    return this.subscriptionsService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary:
      "Create a volume-based subscription (one or more protein pools + a delivery cadence) and materialize its first week of orders. Always staff-created — see the CustomPlanRequest flow for customer-initiated asks.",
  })
  @ApiResponse({ status: 201, description: "Subscription, its pools, and the first week's orders created." })
  @ApiResponse({ status: 400, description: "No available menu item for a purchased protein" })
  async create(@Body() dto: CreateSubscriptionDto): Promise<Subscription> {
    return this.subscriptionsService.create(dto);
  }

  @Put(":id")
  @ApiOperation({
    summary: "Update package name / price / payment / status / cadence. Does not touch already-materialized orders.",
  })
  @ApiResponse({ status: 200, description: "Subscription updated." })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    return this.subscriptionsService.update(id, dto);
  }

  @Post(":id/top-up")
  @ApiOperation({ summary: "Add more purchased weight to a protein pool (or start a new one)" })
  @ApiResponse({ status: 200, description: "Pool topped up and near-term orders re-synced." })
  async topUpPool(@Param("id", ParseUUIDPipe) id: string, @Body() dto: TopUpPoolDto): Promise<Subscription> {
    return this.subscriptionsService.topUpPool(id, dto);
  }

  @Post("sync-orders")
  @ApiOperation({
    summary: "Materialize any due-within-7-days Order rows across all active subscriptions (safe to call repeatedly)",
  })
  @ApiResponse({ status: 200, description: "Returns how many new Order rows were created." })
  async syncOrders() {
    return this.subscriptionsService.syncUpcomingOrders();
  }

  @Delete(":id")
  @Roles("ADMIN", "MANAGER")
  @ApiOperation({ summary: "Delete a subscription, its pools, and its whole order schedule" })
  @ApiResponse({ status: 200, description: "Subscription and its orders deleted." })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.subscriptionsService.remove(id);
  }
}
