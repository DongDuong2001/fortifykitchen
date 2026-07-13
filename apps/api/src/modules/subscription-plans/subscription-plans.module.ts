import { Module } from "@nestjs/common";
import { SubscriptionPlansController } from "./controller/subscription-plans.controller";
import { PublicSubscriptionPlansController } from "./controller/public-subscription-plans.controller";
import { SubscriptionPlanPurchasesController } from "./controller/subscription-plan-purchases.controller";
import { PlanUpgradeRequestsController } from "./controller/plan-upgrade-requests.controller";
import { SubscriptionPlansService } from "./service/subscription-plans.service";

@Module({
  // PublicSubscriptionPlansController ("subscription-plans/public") MUST be
  // registered before SubscriptionPlansController ("subscription-plans/:id")
  // — otherwise ":id" would swallow "public" as an id param. Same
  // route-ordering hazard documented on SubscriptionsModule/
  // CustomPlanRequestsModule. SubscriptionPlanPurchasesController and
  // PlanUpgradeRequestsController each live under their own top-level path
  // so they never collide with either.
  controllers: [
    PublicSubscriptionPlansController,
    SubscriptionPlansController,
    SubscriptionPlanPurchasesController,
    PlanUpgradeRequestsController,
  ],
  providers: [SubscriptionPlansService],
  exports: [SubscriptionPlansService],
})
export class SubscriptionPlansModule {}
