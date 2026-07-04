import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { MenuService } from "../service/menu.service";
import { CreateMenuItemDto } from "../dto/create-menu-item.dto";
import { MenuItem } from "@fortifykitchen/types";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";

@ApiTags("menu")
@Controller("menu")
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: "Get all available menu items" })
  @ApiQuery({ name: "categoryId", required: false, type: String })
  @ApiResponse({ status: 200, description: "Returns list of available menu items." })
  async findAll(@Query("categoryId") categoryId?: string): Promise<MenuItem[]> {
    return this.menuService.findAll(categoryId);
  }

  @Get("admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "MANAGER", "STAFF")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get all menu items including unavailable (Admin/Staff only)" })
  @ApiResponse({ status: 200, description: "Returns list of all menu items." })
  async findAllAdmin(): Promise<MenuItem[]> {
    return this.menuService.findAllAdmin();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get menu item by ID" })
  @ApiResponse({ status: 200, description: "Returns menu item details." })
  @ApiResponse({ status: 404, description: "Menu item not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<MenuItem> {
    return this.menuService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Create a new menu item (Admin/Manager only)" })
  @ApiResponse({ status: 201, description: "Menu item created." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async create(@Body() dto: CreateMenuItemDto): Promise<MenuItem> {
    return this.menuService.create(dto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update a menu item (Admin/Manager only)" })
  @ApiResponse({ status: 200, description: "Menu item updated." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Menu item not found" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateMenuItemDto,
  ): Promise<MenuItem> {
    return this.menuService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a menu item (Admin only)" })
  @ApiResponse({ status: 204, description: "Menu item deleted." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Menu item not found" })
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.menuService.remove(id);
  }
}
