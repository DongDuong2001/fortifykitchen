import { Module } from "@nestjs/common";
import { CustomPlanRequestsController } from "./controller/custom-plan-requests.controller";
import { PublicCustomPlanRequestsController } from "./controller/public-custom-plan-requests.controller";
import { CustomPlanRequestsService } from "./service/custom-plan-requests.service";

@Module({
  // PublicCustomPlanRequestsController ("custom-plan-requests/public") MUST
  // be registered before CustomPlanRequestsController
  // ("custom-plan-requests/:id") — otherwise ":id" would swallow "public"
  // as an id param. Same route-ordering hazard documented on
  // SubscriptionsModule/OrdersModule.
  controllers: [PublicCustomPlanRequestsController, CustomPlanRequestsController],
  providers: [CustomPlanRequestsService],
  exports: [CustomPlanRequestsService],
})
export class CustomPlanRequestsModule {}
