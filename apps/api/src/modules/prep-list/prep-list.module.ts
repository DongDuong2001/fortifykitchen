import { Module } from "@nestjs/common";
import { PrepListController } from "./controller/prep-list.controller";
import { PrepListService } from "./service/prep-list.service";

@Module({
  controllers: [PrepListController],
  providers: [PrepListService],
  exports: [PrepListService],
})
export class PrepListModule {}
