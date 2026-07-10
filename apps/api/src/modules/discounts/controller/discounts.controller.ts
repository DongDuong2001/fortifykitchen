import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { DiscountsService } from "../service/discounts.service";
import { CreateDiscountDto } from "../dto/create-discount.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

@ApiTags("discounts")
@Controller("discounts")
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Get("verify")
  @ApiOperation({ summary: "Verify and retrieve discount code details" })
  @ApiResponse({ status: 200, description: "Code is valid. Returns discount info." })
  @ApiResponse({ status: 400, description: "Discount code is invalid or expired" })
  @ApiResponse({ status: 404, description: "Discount code not found" })
  async verify(@Query("code") code: string) {
    return this.discountsService.verify(code);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("CUSTOMER")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get the current customer's own active personal voucher, if any" })
  @ApiResponse({ status: 200, description: "Returns the active voucher, or null if none." })
  async findMine(@CurrentUser() user: any) {
    return this.discountsService.findMyActive(user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get all discount codes (Admin/Manager only)" })
  @ApiResponse({ status: 200, description: "Returns list of all codes." })
  async findAll() {
    return this.discountsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Create a discount code (Admin/Manager only)" })
  @ApiResponse({ status: 201, description: "Discount code created." })
  @ApiResponse({ status: 409, description: "Discount code already exists" })
  async create(@Body() dto: CreateDiscountDto) {
    return this.discountsService.create(dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a discount code (Admin only)" })
  @ApiResponse({ status: 240, description: "Discount code deleted." })
  @ApiResponse({ status: 404, description: "Discount code not found" })
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.discountsService.remove(id);
  }
}
