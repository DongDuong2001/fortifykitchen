import { BadRequestException, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { SubscriptionsService } from "../service/subscriptions.service";
import { OrdersService } from "../../orders/service/orders.service";

// Customer-web self-service — there is no customer login system in this
// product yet, so a phone number (already collected on every Customer
// record) is used as a lightweight identity check for read-only balance
// viewing and the "postpone today's order" action. No JWT/roles guard on
// purpose: this is meant to be reachable directly from the storefront.
@ApiTags("public-subscriptions")
@Controller("subscriptions/public")
export class PublicSubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Look up a customer's subscriptions (with pool balances) by phone number" })
  @ApiQuery({ name: "phone", required: true, type: String })
  @ApiResponse({ status: 200, description: "Returns matching subscriptions, or an empty list if the phone isn't on file." })
  async lookup(@Query("phone") phone?: string) {
    if (!phone) {
      throw new BadRequestException("Query param 'phone' is required");
    }
    const subscriptions = await this.subscriptionsService.findForPhone(phone);
    const withUpcoming = await Promise.all(
      subscriptions.map(async (sub) => {
        const upcomingOrders = await this.ordersService.findUpcomingForSubscription(sub.id, 5);
        return { ...sub, upcomingOrders };
      }),
    );
    return withUpcoming;
  }

  @Post(":orderId/postpone")
  @ApiOperation({ summary: "Postpone a subscription order — verifies the phone number owns it first" })
  @ApiQuery({ name: "phone", required: true, type: String })
  @ApiResponse({ status: 200, description: "Schedule shifted." })
  @ApiResponse({ status: 403, description: "Phone number doesn't match this order's subscription" })
  async postpone(@Param("orderId", ParseUUIDPipe) orderId: string, @Query("phone") phone?: string) {
    if (!phone) {
      throw new BadRequestException("Query param 'phone' is required");
    }
    const owns = await this.ordersService.verifySubscriptionOrderOwnership(orderId, phone);
    if (!owns) {
      throw new ForbiddenException("Số điện thoại không khớp với đơn này");
    }
    return this.ordersService.postpone(orderId);
  }
}
