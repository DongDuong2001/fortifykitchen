import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerModuleOptions, ThrottlerGuard } from "@nestjs/throttler";
import { ConfigModule } from "./config/config.module";
import { ConfigService } from "./config/config.service";
import { DatabaseModule } from "./database/database.module";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { MenuModule } from "./modules/menu/menu.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { DiscountsModule } from "./modules/discounts/discounts.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { CustomPlanRequestsModule } from "./modules/custom-plan-requests/custom-plan-requests.module";
import { SubscriptionPlansModule } from "./modules/subscription-plans/subscription-plans.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { PrepListModule } from "./modules/prep-list/prep-list.module";
import { UploadModule } from "./modules/upload/upload.module";
import { HomeFramesModule } from "./modules/home-frames/home-frames.module";
import { CronModule } from "./modules/cron/cron.module";
import { HealthController } from "./common/health/health.controller";

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    MenuModule,
    CustomersModule,
    DiscountsModule,
    OrdersModule,
    SubscriptionsModule,
    CustomPlanRequestsModule,
    SubscriptionPlansModule,
    NotificationsModule,
    DashboardModule,
    PrepListModule,
    UploadModule,
    HomeFramesModule,
    CronModule,
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
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
