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
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization token");
    }

    const token = authHeader.split(" ")[1];

    try {
      // Verifies the HMAC-SHA256 signature against JWT_SECRET and checks
      // expiry — previously this only base64-decoded the payload with no
      // signature check at all, so any hand-crafted token was accepted.
      const payload = verifyJwt(token, this.configService.get("JWT_SECRET"));
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired authorization token");
    }
  }
}
