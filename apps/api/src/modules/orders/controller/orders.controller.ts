import { Controller, Get, Post, Put, Body, Param, UseGuards, ParseUUIDPipe, ForbiddenException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { OrdersService } from "../service/orders.service";
import { CreateOrderDto } from "../dto/create-order.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { OrderStatus } from "@fortifykitchen/types";

@ApiTags("orders")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles("CUSTOMER")
  @ApiOperation({ summary: "Place a new meal/food order" })
  @ApiResponse({ status: 201, description: "Order placed successfully." })
  @ApiResponse({ status: 400, description: "Bad request / out-of-stock items" })
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id, dto);
  }

  @Get("me")
  @Roles("CUSTOMER")
  @ApiOperation({ summary: "Get order history for current logged-in customer" })
  @ApiResponse({ status: 200, description: "Returns list of customer's orders." })
  async findAllMyOrders(@CurrentUser() user: { id: string }) {
    return this.ordersService.findAllByUserId(user.id);
  }

  @Get()
  @Roles("ADMIN", "MANAGER", "STAFF")
  @ApiOperation({ summary: "Get all system orders (Admin/Staff only)" })
  @ApiResponse({ status: 200, description: "Returns list of all orders." })
  async findAll() {
    return this.ordersService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get order details by ID" })
  @ApiResponse({ status: 200, description: "Returns full order transaction details." })
  @ApiResponse({ status: 403, description: "Forbidden - cannot access other users' orders" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async findOne(@CurrentUser() user: { id: string; role: string }, @Param("id", ParseUUIDPipe) id: string) {
    const order = await this.ordersService.findOne(id);
    // Customers can only view their own orders
    if (user.role === "CUSTOMER") {
      const myOrders = await this.ordersService.findAllByUserId(user.id);
      const isMyOrder = myOrders.some((o) => o.id === id);
      if (!isMyOrder) {
        throw new ForbiddenException("You do not have permission to view this order");
      }
    }
    return order;
  }

  @Put(":id/status")
  @Roles("ADMIN", "MANAGER", "STAFF")
  @ApiOperation({ summary: "Update order status and trigger delivery/COD payment logic (Admin/Staff only)" })
  @ApiResponse({ status: 200, description: "Order status successfully updated." })
  @ApiResponse({ status: 404, description: "Order not found" })
  async updateStatus(@Param("id", ParseUUIDPipe) id: string, @Body("status") status: OrderStatus) {
    return this.ordersService.updateStatus(id, status);
  }
}
