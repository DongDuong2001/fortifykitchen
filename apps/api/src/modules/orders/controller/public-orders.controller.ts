import { BadRequestException, Controller, Get, Post, Body, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { OrdersService } from "../service/orders.service";
import { CreatePublicOrderDto } from "../dto/create-public-order.dto";
import { Order } from "@fortifykitchen/types";

// Customer-web self-checkout — no customer login system in this product yet,
// so a phone number is used as a lightweight identity (same pattern as
// PublicSubscriptionsController). No JWT/roles guard on purpose: reachable
// directly from the storefront's "Order Now" tab.
@ApiTags("public-orders")
@Controller("orders/public")
export class PublicOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: "Look up a customer's own order history by phone number" })
  @ApiQuery({ name: "phone", required: true, type: String })
  async lookup(@Query("phone") phone?: string): Promise<Order[]> {
    if (!phone) {
      throw new BadRequestException("Query param 'phone' is required");
    }
    return this.ordersService.findForPhone(phone);
  }

  @Post()
  @ApiOperation({
    summary:
      "Place an order as a customer — server resolves IMMEDIATE vs SCHEDULED from live stock, never the client",
  })
  @ApiResponse({ status: 201, description: "Order created." })
  @ApiResponse({ status: 400, description: "Bad request / unknown menu item" })
  async create(@Body() dto: CreatePublicOrderDto): Promise<Order> {
    return this.ordersService.createPublic(dto);
  }
}
