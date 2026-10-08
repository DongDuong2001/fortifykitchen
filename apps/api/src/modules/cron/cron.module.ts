import { Module } from "@nestjs/common";
import { CronController } from "./controller/cron.controller";
import { CronService } from "./service/cron.service";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import { OrdersModule } from "../orders/orders.module";
import { AuthModule } from "../auth/auth.module";
import { CustomersModule } from "../customers/customers.module";

@Module({
  imports: [
    SubscriptionsModule,
    OrdersModule,
    AuthModule,
    CustomersModule,
  ],
  controllers: [CronController],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}