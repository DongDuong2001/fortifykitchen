import { Module } from "@nestjs/common";
import { ThrottlerModule, ThrottlerModuleOptions } from "@nestjs/throttler";
import { ConfigModule } from "./config/config.module";
import { ConfigService } from "./config/config.service";
import { DatabaseModule } from "./database/database.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    UsersModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): ThrottlerModuleOptions => [
        {
          ttl: config.get("THROTTLE_TTL"),
          limit: config.get("THROTTLE_LIMIT"),
        },
      ],
    }),
  ],
})
export class AppModule {}
