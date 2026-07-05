import { Module } from "@nestjs/common";
import { ThrottlerModule, ThrottlerModuleOptions } from "@nestjs/throttler";
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
import { DeliveryModule } from "./modules/delivery/delivery.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { PrepListModule } from "./modules/prep-list/prep-list.module";

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
    DeliveryModule,
    DashboardModule,
    PrepListModule,
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
