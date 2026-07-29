import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "../../config/config.service";
import { verifyJwt } from "../utils/jwt.util";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    let token: string | undefined;

    // 1. Extract from HttpOnly Cookie (Primary)
    if (request.cookies && (request.cookies.fk_token || request.cookies.access_token)) {
      token = request.cookies.fk_token || request.cookies.access_token;
    }
    // 2. Fallback to Authorization Header (Bearer <token>)
    else if (request.headers.authorization && request.headers.authorization.startsWith("Bearer ")) {
      token = request.headers.authorization.split(" ")[1];
    }

    if (!token || token === "null" || token === "undefined") {
      throw new UnauthorizedException("Missing or invalid authorization token");
    }

    try {
      // Verifies the HMAC-SHA256 signature against JWT_SECRET and checks expiry
      const payload = verifyJwt(token, this.configService.get("JWT_SECRET"));
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired authorization token");
    }
  }
}
