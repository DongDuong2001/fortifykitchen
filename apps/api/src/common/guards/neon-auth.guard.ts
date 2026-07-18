import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "../../config/config.service";
import { extractBearerToken, verifyNeonAuthToken, JwtVerificationError } from "../utils/neon-auth.util";

@Injectable()
export class NeonAuthGuard implements CanActivate {
  private readonly logger = new Logger(NeonAuthGuard.name);

  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    const token = extractBearerToken(authHeader);
    if (!token) {
      throw new UnauthorizedException("Missing or invalid Authorization header");
    }

    const jwksUrl = this.configService.get("NEON_AUTH_JWKS_URL");
    if (!jwksUrl) {
      this.logger.error("NEON_AUTH_JWKS_URL not configured");
      throw new UnauthorizedException("Authentication not configured");
    }

    const audience = this.configService.get("NEON_AUTH_AUDIENCE");

    try {
      const payload = await verifyNeonAuthToken(token, jwksUrl, audience);
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        ...payload,
      };
      return true;
    } catch (error) {
      if (error instanceof JwtVerificationError) {
        throw new UnauthorizedException(error.message);
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Neon Auth token verification failed: ${errorMessage}`);
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}