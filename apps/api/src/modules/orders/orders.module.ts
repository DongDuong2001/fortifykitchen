import { Module } from "@nestjs/common";
import { OrdersController } from "./controller/orders.controller";
import { PublicOrdersController } from "./controller/public-orders.controller";
import { OrdersService } from "./service/orders.service";

@Module({
  // PublicOrdersController ("orders/public") MUST be registered before
  // OrdersController ("orders/:id") — otherwise "orders/:id" swallows
  // "public" as an id param. Same route-ordering hazard documented on
  // SubscriptionsModule.
  controllers: [PublicOrdersController, OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
