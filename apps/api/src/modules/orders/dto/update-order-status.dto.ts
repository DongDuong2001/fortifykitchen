import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { DeliveryStatus, PaymentState } from "@fortifykitchen/database";

export class UpdateDeliveryStatusDto {
  @ApiProperty({ enum: DeliveryStatus })
  @IsEnum(DeliveryStatus)
  deliveryStatus!: DeliveryStatus;
}

export class UpdatePaymentStatusDto {
  @ApiProperty({ enum: PaymentState })
  @IsEnum(PaymentState)
  paymentStatus!: PaymentState;
}
