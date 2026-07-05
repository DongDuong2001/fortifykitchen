import { Controller, Get, Query, UseGuards, BadRequestException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { PrepListService } from "../service/prep-list.service";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";

@ApiTags("prep-list")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "MANAGER", "STAFF")
@ApiBearerAuth("JWT-auth")
@Controller("prep-list")
export class PrepListController {
  constructor(private readonly prepListService: PrepListService) {}

  @Get()
  @ApiOperation({ summary: "Get the aggregated kitchen prep sheet for a given date" })
  @ApiQuery({ name: "date", required: true, type: String, description: "YYYY-MM-DD" })
  @ApiResponse({ status: 200, description: "Returns per-dish portion/gram totals across that day's orders and deliveries." })
  async getPrepList(@Query("date") date?: string) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException("Query param 'date' is required in YYYY-MM-DD format");
    }
    return this.prepListService.getPrepList(date);
  }
}
