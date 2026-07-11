import { Module } from "@nestjs/common";
import { SubscriptionsController } from "./controller/subscriptions.controller";
import { PublicSubscriptionsController } from "./controller/public-subscriptions.controller";
import { SubscriptionsService } from "./service/subscriptions.service";
import { OrdersModule } from "../orders/orders.module";

@Module({
  // OrdersModule is imported because subscription occurrences are now just
  // Orders (see SubscriptionsService.syncUpcomingOrders, which calls
  // OrdersService.createFromSubscription) — the old dedicated DeliveryModule
  // is gone.
  imports: [OrdersModule],
  // PublicSubscriptionsController MUST be registered before
  // SubscriptionsController — both live under /subscriptions, and
  // SubscriptionsController's GET/PUT/DELETE ":id" routes would otherwise
  // swallow "/subscriptions/public" as if "public" were an :id.
  controllers: [PublicSubscriptionsController, SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
