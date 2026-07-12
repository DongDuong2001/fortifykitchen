import { Module } from "@nestjs/common";
import { DeliveryController } from "./controller/delivery.controller";
import { DeliveryService } from "./service/delivery.service";

@Module({
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
