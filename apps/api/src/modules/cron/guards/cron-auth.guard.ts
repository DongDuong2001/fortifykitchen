import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "../../../config/config.service";

@Injectable()
export class CronAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization header");
    }

    const token = authHeader.substring(7);
    const cronSecret = this.configService.get("CRON_SECRET");

    if (!cronSecret) {
      if (this.configService.get("NODE_ENV") === "production") {
        console.error("CRON_SECRET not configured in production!");
      }
      throw new UnauthorizedException("Cron authentication not configured");
    }

    if (token !== cronSecret) {
      throw new UnauthorizedException("Invalid cron secret");
    }

    request.cronJobName = request.headers["x-cron-job-name"] || "unknown";
    return true;
  }
}