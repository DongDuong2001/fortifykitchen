import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsEnum } from "class-validator";
import { PaymentState, SubscriptionStatus } from "@fortifykitchen/database";

// Editing a subscription does NOT touch already-materialized Delivery rows
// or pool balances — deliveryAmountGrams/deliveryIntervalDays changes only
// take effect for occurrences generated AFTER this edit (the next
// syncUpcomingDeliveries run picks up the new cadence from whatever the
// last existing delivery's date is). Use the Delivery endpoints
// (mark-delivered / postpone) to adjust individual occurrences, and the
// pool top-up endpoint to add more purchased weight.
export class UpdateSubscriptionDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  packageName?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  totalPrice?: number;

  @ApiProperty({ enum: PaymentState, required: false })
  @IsEnum(PaymentState)
  @IsOptional()
  paymentStatus?: PaymentState;

  @ApiProperty({ enum: SubscriptionStatus, required: false })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @ApiProperty({ required: false, description: "Grams delivered per occurrence going forward" })
  @IsInt()
  @Min(1)
  @IsOptional()
  deliveryAmountGrams?: number;

  @ApiProperty({ required: false, description: "Days between deliveries going forward" })
  @IsInt()
  @Min(1)
  @IsOptional()
  deliveryIntervalDays?: number;
}
