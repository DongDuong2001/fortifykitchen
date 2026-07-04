import { Module } from "@nestjs/common";
import { SubscriptionsController } from "./controller/subscriptions.controller";
import { SubscriptionsService } from "./service/subscriptions.service";

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
