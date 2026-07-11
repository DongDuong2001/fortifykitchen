import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { HomeFramesService } from "../service/home-frames.service";
import { CreateHomeFrameDto } from "../dto/create-home-frame.dto";
import { UpdateHomeFrameDto } from "../dto/update-home-frame.dto";
import { HomeFrame } from "@fortifykitchen/types";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";

@ApiTags("home-frames")
@Controller("home-frames")
export class HomeFramesController {
  constructor(private readonly homeFramesService: HomeFramesService) {}

  @Get()
  @ApiOperation({ summary: "Get all active home image frames" })
  @ApiResponse({ status: 200, description: "Returns active home frames." })
  async findAllActive(): Promise<HomeFrame[]> {
    return this.homeFramesService.findAllActive();
  }

  @Get("admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get all home image frames (Admin/Manager only)" })
  @ApiResponse({ status: 200, description: "Returns all home frames." })
  async findAllAdmin(): Promise<HomeFrame[]> {
    return this.homeFramesService.findAllAdmin();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get home image frame by ID" })
  @ApiResponse({ status: 200, description: "Returns the home frame details." })
  @ApiResponse({ status: 404, description: "Home frame not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<HomeFrame> {
    return this.homeFramesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Create a new home image frame (Admin/Manager only)" })
  @ApiResponse({ status: 201, description: "Home frame created." })
  async create(@Body() dto: CreateHomeFrameDto): Promise<HomeFrame> {
    return this.homeFramesService.create(dto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update home image frame by ID (Admin/Manager only)" })
  @ApiResponse({ status: 200, description: "Home frame updated." })
  @ApiResponse({ status: 404, description: "Home frame not found" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateHomeFrameDto,
  ): Promise<HomeFrame> {
    return this.homeFramesService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete home image frame (Admin only)" })
  @ApiResponse({ status: 204, description: "Home frame deleted." })
  @ApiResponse({ status: 404, description: "Home frame not found" })
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.homeFramesService.remove(id);
  }
}
