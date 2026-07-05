import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { OrdersService } from "../service/orders.service";
import { CreateOrderDto } from "../dto/create-order.dto";
import { UpdateOrderDto } from "../dto/update-order.dto";
import { UpdateDeliveryStatusDto, UpdatePaymentStatusDto } from "../dto/update-order-status.dto";
import { Order } from "@fortifykitchen/types";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";

// Orders are staff-created on behalf of a customer — there is no customer
// self-checkout in this product yet, so every route here is staff-only.
@ApiTags("orders")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "MANAGER", "STAFF")
@ApiBearerAuth("JWT-auth")
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: "Get all orders" })
  @ApiResponse({ status: 200, description: "Returns list of all orders." })
  async findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get order details by ID" })
  @ApiResponse({ status: 200, description: "Returns full order details." })
  @ApiResponse({ status: 404, description: "Order not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a new order — server computes pricing via the discount engine" })
  @ApiResponse({ status: 201, description: "Order created." })
  @ApiResponse({ status: 400, description: "Bad request / unknown menu item" })
  async create(@Body() dto: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update an order — resends the full form, repriced from scratch" })
  @ApiResponse({ status: 200, description: "Order updated." })
  @ApiResponse({ status: 404, description: "Order not found" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderDto,
  ): Promise<Order> {
    return this.ordersService.update(id, dto);
  }

  @Patch(":id/delivery-status")
  @ApiOperation({ summary: "Update an order's delivery/fulfillment status" })
  @ApiResponse({ status: 200, description: "Delivery status updated." })
  async updateDeliveryStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ): Promise<Order> {
    return this.ordersService.updateDeliveryStatus(id, dto.deliveryStatus);
  }

  @Patch(":id/payment-status")
  @ApiOperation({ summary: "Update an order's payment status" })
  @ApiResponse({ status: 200, description: "Payment status updated." })
  async updatePaymentStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ): Promise<Order> {
    return this.ordersService.updatePaymentStatus(id, dto.paymentStatus);
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
