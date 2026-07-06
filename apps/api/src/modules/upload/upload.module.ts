import { Module } from "@nestjs/common";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";

@Module({
  controllers: [UploadController],
  providers: [UploadService],
  // Export so other modules can inject UploadService if needed in the future
  // (e.g., bulk import, CSV + images at once).
  exports: [UploadService],
})
export class UploadModule {}
