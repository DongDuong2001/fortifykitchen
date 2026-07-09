import { BadRequestException, Controller, Get, Post, Body, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { CustomPlanRequestsService } from "../service/custom-plan-requests.service";
import { CreateCustomPlanRequestDto } from "../dto/create-custom-plan-request.dto";
import { CustomPlanRequest } from "@fortifykitchen/types";

// Customer-facing entry point — "I want something outside the standard
// catalog" starts here, never as a self-serve Subscription (see
// SubscriptionsController: staff-only). No JWT/roles guard on purpose:
// reachable directly from the storefront, same pattern as
// PublicOrdersController / PublicSubscriptionsController.
@ApiTags("public-custom-plan-requests")
@Controller("custom-plan-requests/public")
export class PublicCustomPlanRequestsController {
  constructor(private readonly service: CustomPlanRequestsService) {}

  @Post()
  @ApiOperation({ summary: "Submit a custom plan request for staff to review and consult on" })
  @ApiResponse({ status: 201, description: "Request submitted, status PENDING." })
  async create(@Body() dto: CreateCustomPlanRequestDto): Promise<CustomPlanRequest> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Look up a customer's own custom plan requests by phone number" })
  @ApiQuery({ name: "phone", required: true, type: String })
  async lookup(@Query("phone") phone?: string): Promise<CustomPlanRequest[]> {
    if (!phone) {
      throw new BadRequestException("Query param 'phone' is required");
    }
    return this.service.findForPhone(phone);
  }
}
