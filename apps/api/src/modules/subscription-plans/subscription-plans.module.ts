import { Module } from "@nestjs/common";
import { SubscriptionPlansController } from "./controller/subscription-plans.controller";
import { PublicSubscriptionPlansController } from "./controller/public-subscription-plans.controller";
import { SubscriptionPlanPurchasesController } from "./controller/subscription-plan-purchases.controller";
import { SubscriptionPlansService } from "./service/subscription-plans.service";

@Module({
  // PublicSubscriptionPlansController ("subscription-plans/public") MUST be
  // registered before SubscriptionPlansController ("subscription-plans/:id")
  // — otherwise ":id" would swallow "public" as an id param. Same
  // route-ordering hazard documented on SubscriptionsModule/
  // CustomPlanRequestsModule. SubscriptionPlanPurchasesController lives
  // under its own top-level path so it never collides with either.
  controllers: [PublicSubscriptionPlansController, SubscriptionPlansController, SubscriptionPlanPurchasesController],
  providers: [SubscriptionPlansService],
  exports: [SubscriptionPlansService],
})
export class SubscriptionPlansModule {}
