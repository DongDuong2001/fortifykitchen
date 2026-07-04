import { Module } from "@nestjs/common";
import { MenuController } from "./controller/menu.controller";
import { MenuService } from "./service/menu.service";

@Module({
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
