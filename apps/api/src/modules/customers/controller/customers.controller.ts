import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { CustomersService } from "../service/customers.service";
import { CreateCustomerDto } from "../dto/create-customer.dto";
import { UpdateCustomerDto } from "../dto/update-customer.dto";
import { Customer } from "@fortifykitchen/types";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

// Staff-only directory — customers have no login/self-service today (see
// packages/database's schema.prisma comment on the Customer model).
@ApiTags("customers")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "MANAGER", "STAFF")
@ApiBearerAuth("JWT-auth")
@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: "Get all customers" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number, description: "Max 200 per page" })
  @ApiResponse({ status: 200, description: "Returns the customer directory." })
  async findAll(@Query("page") page?: string, @Query("limit") limit?: string): Promise<Customer[]> {
    return this.customersService.findAll(page, limit);
  }

  @Get("me")
  @Roles("ADMIN", "MANAGER", "STAFF", "CUSTOMER")
  @ApiOperation({ summary: "Get current customer profile" })
  @ApiResponse({ status: 200, description: "Returns own customer profile." })
  async findMe(@CurrentUser() user: any): Promise<Customer> {
    return this.customersService.findByUserId(user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a customer by ID" })
  @ApiResponse({ status: 200, description: "Returns customer details." })
  @ApiResponse({ status: 404, description: "Customer not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<Customer> {
    return this.customersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a new customer" })
  @ApiResponse({ status: 201, description: "Customer created." })
  async create(@Body() dto: CreateCustomerDto): Promise<Customer> {
    return this.customersService.create(dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a customer" })
  @ApiResponse({ status: 200, description: "Customer updated." })
  @ApiResponse({ status: 404, description: "Customer not found" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customersService.update(id, dto);
  }

  @Delete(":id")
  @Roles("ADMIN", "MANAGER")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete a customer. Linked orders/subscriptions are orphaned, not deleted." })
  @ApiResponse({ status: 200, description: "Customer deleted; returns count of orphaned records." })
  @ApiResponse({ status: 404, description: "Customer not found" })
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.customersService.remove(id);
  }
}
