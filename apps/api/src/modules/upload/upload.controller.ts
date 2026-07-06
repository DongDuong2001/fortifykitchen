import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { memoryStorage } from "multer";
import { UploadService, UploadResult } from "./upload.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

// Allowed MIME types — reject anything that isn't a raster image format
// supported by Cloudinary's auto-format pipeline.
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// 5 MB hard limit per upload — generous enough for a hi-res food photo,
// tight enough to keep Cloudinary bandwidth costs reasonable.
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@ApiTags("upload")
@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("image")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Upload a product image to Cloudinary (Admin/Manager only)" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
    },
  })
  @ApiResponse({ status: 201, description: "Image uploaded — returns secure URL and publicId." })
  @ApiResponse({ status: 400, description: "No file / invalid type / exceeds size limit" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden — Admin/Manager only" })
  @UseInterceptors(
    FileInterceptor("file", {
      // Keep file in memory (Buffer) — we stream it straight to Cloudinary
      // without writing a temp file to disk.
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Unsupported file type "${file.mimetype}". Accepted: ${ALLOWED_MIME_TYPES.join(", ")}`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException("No file uploaded. Send a multipart/form-data request with field name \"file\".");
    }

    return this.uploadService.uploadImage(file.buffer, file.originalname);
  }
}
