import { Controller, Get, UseGuards, Param, ParseUUIDPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "../service/users.service";
import { UserResponseDto } from "../dto/user-response.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";

@ApiTags("users")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(":id")
  @Roles("ADMIN", "MANAGER", "STAFF")
  @ApiOperation({ summary: "Get user profile by ID" })
  @ApiResponse({
    status: 200,
    description: "Returns the matching user profile details.",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "User profile not found" })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.getUserById(id);
  }
}
