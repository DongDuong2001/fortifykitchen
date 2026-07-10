import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { OrderStatus, PaymentState } from "@fortifykitchen/database";

// Single unified status shared by one-off orders and subscription-generated
// orders alike — see the OrderStatus enum comment in schema.prisma for the
// full Shopee-style lifecycle.
export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

export class UpdatePaymentStatusDto {
  @ApiProperty({ enum: PaymentState })
  @IsEnum(PaymentState)
  paymentStatus!: PaymentState;
}
