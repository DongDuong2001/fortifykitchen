import { Controller, Post, Body, HttpCode, HttpStatus, Res } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Response, CookieOptions } from "express";
import { AuthService } from "../service/auth.service";
import { SignupDto } from "../dto/signup.dto";
import { LoginDto } from "../dto/login.dto";
import { AuthResponseDto } from "../dto/auth-response.dto";

const isProduction = process.env.NODE_ENV === "production";
const getCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
});

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  @ApiOperation({ summary: "Register a new customer account" })
  @ApiResponse({
    status: 201,
    description: "Account successfully created.",
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad Request / Validation Failure" })
  @ApiResponse({ status: 409, description: "Email already registered" })
  async signup(
    @Body() signupDto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const authData = await this.authService.signup(signupDto);
    
    // Set HttpOnly Cookie for secure token storage
    res.cookie("fk_token", authData.accessToken, getCookieOptions());
    res.cookie("access_token", authData.accessToken, getCookieOptions());

    return authData;
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Authenticate credentials and obtain JWT access token" })
  @ApiResponse({
    status: 200,
    description: "Authentication successful.",
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const authData = await this.authService.login(loginDto);

    // Set HttpOnly Cookie for secure token storage
    res.cookie("fk_token", authData.accessToken, getCookieOptions());
    res.cookie("access_token", authData.accessToken, getCookieOptions());

    return authData;
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Log out user and clear authentication cookies" })
  @ApiResponse({ status: 200, description: "Logged out successfully" })
  async logout(@Res({ passthrough: true }) res: Response) {
    const clearOptions: CookieOptions = {
      ...getCookieOptions(),
      maxAge: 0,
      expires: new Date(0),
    };

    res.cookie("fk_token", "", clearOptions);
    res.cookie("access_token", "", clearOptions);

    return {
      success: true,
      message: "Logged out successfully",
    };
  }
}
