import { Module } from "@nestjs/common";
import { HomeFramesController } from "./controller/home-frames.controller";
import { HomeFramesService } from "./service/home-frames.service";

@Module({
  controllers: [HomeFramesController],
  providers: [HomeFramesService],
  exports: [HomeFramesService],
})
export class HomeFramesModule {}
