import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { SubscriptionPlansService } from "../service/subscription-plans.service";
import { CreateSubscriptionPlanDto } from "../dto/create-subscription-plan.dto";
import { UpdateSubscriptionPlanDto } from "../dto/update-subscription-plan.dto";
import { SubscriptionPlan } from "@fortifykitchen/types";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";

// Staff catalog management for SubscriptionPlan (price tiers). Buying a
// plan is a separate, customer-facing flow — see
// PublicSubscriptionPlansController. Confirming/rejecting a pending
// purchase lives in SubscriptionPlanPurchasesController, deliberately kept
// out of this controller's ":id" route space (same swallowing hazard
// documented on SubscriptionsModule).
@ApiTags("subscription-plans")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "MANAGER", "STAFF")
@ApiBearerAuth("JWT-auth")
@Controller("subscription-plans")
export class SubscriptionPlansController {
  constructor(private readonly service: SubscriptionPlansService) {}

  @Get()
  @ApiOperation({ summary: "List all subscription plan tiers, including inactive ones" })
  async findAll(): Promise<SubscriptionPlan[]> {
    return this.service.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one subscription plan tier" })
  @ApiResponse({ status: 404, description: "Not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<SubscriptionPlan> {
    return this.service.findOne(id);
  }

  @Post()
  @Roles("ADMIN", "MANAGER")
  @ApiOperation({ summary: "Create a subscription plan tier" })
  @ApiResponse({ status: 201, description: "Created." })
  async create(@Body() dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    return this.service.create(dto);
  }

  @Put(":id")
  @Roles("ADMIN", "MANAGER")
  @ApiOperation({ summary: "Update a subscription plan tier — e.g. price, voucher %, or retire it via isActive" })
  async update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @Roles("ADMIN")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a subscription plan tier (Admin only) — prefer isActive: false if it's ever been purchased" })
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.service.remove(id);
  }
}
