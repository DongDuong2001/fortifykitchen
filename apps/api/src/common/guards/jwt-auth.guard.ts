import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization token");
    }

    const token = authHeader.split(" ")[1];

    try {
      // Decodes token payload. In production, use standard library verification (e.g. jsonwebtoken)
      const payload = this.decodeToken(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired authorization token");
    }
  }

  private decodeToken(token: string) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) throw new Error();
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
      return payload;
    } catch {
      throw new UnauthorizedException("Invalid token format");
    }
  }
}
