import { Module } from "@nestjs/common";
import { SubscriptionsController } from "./controller/subscriptions.controller";
import { PublicSubscriptionsController } from "./controller/public-subscriptions.controller";
import { SubscriptionsService } from "./service/subscriptions.service";
import { DeliveryModule } from "../delivery/delivery.module";

@Module({
  imports: [DeliveryModule],
  // PublicSubscriptionsController MUST be registered before
  // SubscriptionsController — both live under /subscriptions, and
  // SubscriptionsController's GET/PUT/DELETE ":id" routes would otherwise
  // swallow "/subscriptions/public" as if "public" were an :id.
  controllers: [PublicSubscriptionsController, SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
