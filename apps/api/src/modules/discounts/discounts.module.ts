import { Module } from "@nestjs/common";
import { DiscountsController } from "./controller/discounts.controller";
import { DiscountsService } from "./service/discounts.service";

@Module({
  controllers: [DiscountsController],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
