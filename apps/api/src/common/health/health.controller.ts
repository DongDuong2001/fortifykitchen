import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { DatabaseService } from "../../database/database.service";

@ApiTags("Health")
@Controller("api")
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  @Get("health")
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiResponse({ status: 200, description: "API is healthy" })
  async healthCheck() {
    try {
      // Check database connection
      await this.db.client.$queryRaw`SELECT 1`;
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
      };
    } catch (error) {
      return {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}