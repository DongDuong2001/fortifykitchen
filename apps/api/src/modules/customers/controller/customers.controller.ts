import { Controller, Get, Put, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { CustomersService } from "../service/customers.service";
import { UpdateCustomerDto } from "../dto/update-customer.dto";
import { CustomerProfile } from "@fortifykitchen/types";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

@ApiTags("customers")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current logged-in customer profile" })
  @ApiResponse({ status: 200, description: "Returns customer profile details." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Customer profile not found" })
  async getProfile(@CurrentUser() user: { id: string }): Promise<CustomerProfile> {
    return this.customersService.findOneByUserId(user.id);
  }

  @Put("me")
  @ApiOperation({ summary: "Update current logged-in customer profile" })
  @ApiResponse({ status: 200, description: "Returns updated customer profile details." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerProfile> {
    return this.customersService.updateByUserId(user.id, dto);
  }

  @Get()
  @Roles("ADMIN", "MANAGER", "STAFF")
  @ApiOperation({ summary: "Get all customer profiles (Admin/Staff only)" })
  @ApiResponse({ status: 200, description: "Returns directory of customer profiles." })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async getAll(): Promise<CustomerProfile[]> {
    return this.customersService.findAll();
  }
}
