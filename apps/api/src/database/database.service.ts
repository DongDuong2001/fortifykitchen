import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { prisma } from "@fortifykitchen/database";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  readonly client = prisma;

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
