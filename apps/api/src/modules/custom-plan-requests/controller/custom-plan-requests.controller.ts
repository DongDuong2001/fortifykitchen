import { Controller, Get, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { CustomPlanRequestsService } from "../service/custom-plan-requests.service";
import { UpdateCustomPlanRequestDto } from "../dto/update-custom-plan-request.dto";
import { CustomPlanRequest } from "@fortifykitchen/types";
import { CustomPlanRequestStatus } from "@fortifykitchen/database";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

// Staff review queue for custom plan requests — creation itself always goes
// through the public/customer-facing controller (a request is never staff-
// initiated), staff only ever review, annotate, decline, or (indirectly, by
// creating a Subscription with customPlanRequestId set) match one.
@ApiTags("custom-plan-requests")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "MANAGER", "STAFF")
@ApiBearerAuth("JWT-auth")
@Controller("custom-plan-requests")
export class CustomPlanRequestsController {
  constructor(private readonly service: CustomPlanRequestsService) {}

  @Get()
  @ApiOperation({ summary: "List custom plan requests, optionally filtered by status" })
  @ApiQuery({ name: "status", required: false, enum: CustomPlanRequestStatus })
  @ApiResponse({ status: 200, description: "Returns the list, newest first." })
  async findAll(@Query("status") status?: CustomPlanRequestStatus): Promise<CustomPlanRequest[]> {
    return this.service.findAll(status);
  }

  @Get("me")
  @Roles("ADMIN", "MANAGER", "STAFF", "CUSTOMER")
  @ApiOperation({ summary: "Get the current customer's own custom plan requests" })
  async findMe(@CurrentUser() user: any): Promise<CustomPlanRequest[]> {
    return this.service.findForUser(user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one custom plan request" })
  @ApiResponse({ status: 404, description: "Not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<CustomPlanRequest> {
    return this.service.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update status/adminNotes — e.g. mark REVIEWED while consulting, or DECLINED" })
  @ApiResponse({ status: 200, description: "Updated." })
  async update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateCustomPlanRequestDto): Promise<CustomPlanRequest> {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @Roles("ADMIN", "MANAGER")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a custom plan request" })
  @ApiResponse({ status: 204, description: "Deleted." })
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.service.remove(id);
  }
}
