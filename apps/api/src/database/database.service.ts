import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { prisma } from "@fortifykitchen/database";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  readonly client = prisma;
  private pingInterval: ReturnType<typeof globalThis.setInterval> | null = null;

  async onModuleInit() {
    await this.client.$connect();

    // Periodically ping PostgreSQL every 5 minutes to keep TCP connections alive
    // and prevent cloud DB / Render idle timeouts (which causes "Error in PostgreSQL connection: Error { kind: Closed }").
    this.pingInterval = globalThis.setInterval(async () => {
      try {
        await this.client.$queryRaw`SELECT 1`;
      } catch (error) {
        this.logger.warn(
          `PostgreSQL idle connection ping failed, attempting reconnect: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        try {
          await this.client.$disconnect();
          await this.client.$connect();
          this.logger.log("Reconnected to PostgreSQL successfully");
        } catch (reconnectErr) {
          this.logger.error(
            "Failed to reconnect to PostgreSQL",
            reconnectErr instanceof Error ? reconnectErr.stack : undefined,
          );
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  async onModuleDestroy() {
    if (this.pingInterval) {
      globalThis.clearInterval(this.pingInterval);
    }
    await this.client.$disconnect();
  }
}
