import { Injectable } from "@nestjs/common";
import { ConfigService } from "../../config/config.service";
import { v2 as cloudinary } from "cloudinary";

export interface UploadResult {
  url: string;
  publicId: string;
}

@Injectable()
export class UploadService {
  constructor(private readonly config: ConfigService) {
    // Configure Cloudinary on instantiation using validated env vars
    cloudinary.config({
      cloud_name: this.config.get("CLOUDINARY_CLOUD_NAME"),
      api_key: this.config.get("CLOUDINARY_API_KEY"),
      api_secret: this.config.get("CLOUDINARY_API_SECRET"),
      secure: true,
    });
  }

  // Upload a file buffer to Cloudinary under the "menu-items" folder.
  // Returns the secure HTTPS URL and the public_id (needed for future
  // deletions or transformations).
  async uploadImage(
    buffer: Buffer,
    originalName: string,
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      // Strip the extension from the original filename to use as a
      // human-readable public_id prefix — Cloudinary will de-conflict
      // duplicates automatically.
      const baseName = originalName.replace(/\.[^.]+$/, "");

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "menu-items",
          public_id: `${baseName}-${Date.now()}`,
          // Auto-detect format from the actual bytes, not the filename
          resource_type: "auto",
          // Eager quality optimisation so the customer-facing catalog always
          // gets a well-compressed image without a separate transformation step.
          transformation: [
            { quality: "auto:good", fetch_format: "auto" },
            // Cap at 800 px wide — more than enough for a product card thumbnail
            { width: 800, crop: "limit" },
          ],
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload returned no result"));
            return;
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );

      uploadStream.end(buffer);
    });
  }
}
