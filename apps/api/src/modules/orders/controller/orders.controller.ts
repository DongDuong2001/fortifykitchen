import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { OrdersService } from "../service/orders.service";
import { CreateOrderDto } from "../dto/create-order.dto";
import { UpdateOrderDto } from "../dto/update-order.dto";
import { UpdateOrderStatusDto, UpdatePaymentStatusDto } from "../dto/update-order-status.dto";
import { Order } from "@fortifykitchen/types";
import { OrderSource, OrderStatus } from "@fortifykitchen/database";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

// Orders covers BOTH one-off orders and subscription-generated occurrences
// (filterable by `source`) — see OrdersService for why these were unified
// out of the old separate Order/Delivery split.
@ApiTags("orders")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "MANAGER", "STAFF")
@ApiBearerAuth("JWT-auth")
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles("ADMIN", "MANAGER", "STAFF")
  @ApiOperation({ summary: "Get orders, optionally filtered by source/status/date" })
  @ApiQuery({ name: "page", required: false, type: Number, description: "Optional — omit to get every order" })
  @ApiQuery({ name: "limit", required: false, type: Number, description: "Max 200 per page" })
  @ApiQuery({ name: "source", required: false, enum: OrderSource })
  @ApiQuery({ name: "status", required: false, enum: OrderStatus })
  @ApiQuery({ name: "date", required: false, type: String })
  @ApiResponse({ status: 200, description: "Returns list of orders." })
  async findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("source") source?: OrderSource,
    @Query("status") status?: OrderStatus,
    @Query("date") date?: string,
  ): Promise<Order[]> {
    return this.ordersService.findAll({ page, limit, source, status, date });
  }

  @Get("upcoming")
  @ApiOperation({ summary: "Get upcoming (today onward), still-active orders of either source, grouped by day/week/month" })
  @ApiQuery({ name: "groupBy", required: false, enum: ["day", "week", "month"] })
  @ApiResponse({ status: 200, description: "Returns grouped upcoming entries." })
  async findUpcomingGrouped(@Query("groupBy") groupBy?: "day" | "week" | "month") {
    return this.ordersService.findUpcomingGrouped(groupBy ?? "week");
  }

  @Get("me")
  @Roles("ADMIN", "MANAGER", "STAFF", "CUSTOMER")
  @ApiOperation({ summary: "Get own order history" })
  @ApiResponse({ status: 200, description: "Returns customer's order history." })
  async findMe(@CurrentUser() user: any): Promise<Order[]> {
    return this.ordersService.findForUser(user.id);
  }

  @Get("subscription/:subscriptionId")
  @ApiOperation({ summary: "Get the full order history/schedule for one subscription" })
  @ApiResponse({ status: 200, description: "Returns that subscription's Order rows." })
  async findBySubscription(@Param("subscriptionId", ParseUUIDPipe) subscriptionId: string): Promise<Order[]> {
    return this.ordersService.findBySubscription(subscriptionId);
  }

  @Get(":id")
  @Roles("ADMIN", "MANAGER", "STAFF")
  @ApiOperation({ summary: "Get order details by ID" })
  @ApiResponse({ status: 200, description: "Returns full order details." })
  @ApiResponse({ status: 404, description: "Order not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  @Post()
  @Roles("ADMIN", "MANAGER", "STAFF", "CUSTOMER")
  @ApiOperation({ summary: "Create a new one-off order — server computes pricing via the discount engine" })
  @ApiResponse({ status: 201, description: "Order created." })
  @ApiResponse({ status: 400, description: "Bad request / unknown menu item" })
  async create(@Body() dto: CreateOrderDto, @CurrentUser() user: any): Promise<Order> {
    return this.ordersService.create(dto, user.id, user.role);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update an order — resends the full form, repriced from scratch" })
  @ApiResponse({ status: 200, description: "Order updated." })
  @ApiResponse({ status: 404, description: "Order not found" })
  async update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateOrderDto): Promise<Order> {
    return this.ordersService.update(id, dto);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update an order's status (COMPLETED triggers subscription pool deduction, if applicable)" })
  @ApiResponse({ status: 200, description: "Status updated." })
  async updateStatus(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateOrderStatusDto): Promise<Order> {
    return this.ordersService.updateStatus(id, dto.status);
  }

  @Patch(":id/payment-status")
  @ApiOperation({ summary: "Update an order's payment status" })
  @ApiResponse({ status: 200, description: "Payment status updated." })
  async updatePaymentStatus(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdatePaymentStatusDto): Promise<Order> {
    return this.ordersService.updatePaymentStatus(id, dto.paymentStatus);
  }

  @Post(":id/postpone")
  @ApiOperation({
    summary:
      "Postpone this (and every later active) order for its subscription by one interval — no pool deduction happens, the whole remaining schedule shifts",
  })
  @ApiResponse({ status: 200, description: "Schedule shifted." })
  @ApiResponse({ status: 400, description: "Order isn't part of a subscription, or is already completed/cancelled" })
  async postpone(@Param("id", ParseUUIDPipe) id: string): Promise<Order> {
    return this.ordersService.postpone(id);
  }

  @Delete(":id")
  @Roles("ADMIN", "MANAGER")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an order" })
  @ApiResponse({ status: 204, description: "Order deleted." })
  @ApiResponse({ status: 404, description: "Order not found" })
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.ordersService.remove(id);
  }
}
