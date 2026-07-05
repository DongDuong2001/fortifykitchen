import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
  IsInt,
  IsUUID,
  IsDateString,
  ArrayMinSize,
} from "class-validator";
import { Type } from "class-transformer";
import { PaymentState, Protein } from "@fortifykitchen/database";

// One protein "pool" being purchased in bulk, e.g. { protein: CHICKEN,
// totalGrams: 30000 } = 30kg of chicken. The specific flavor is chosen per
// delivery later, not here — see DeliveryItem.
class SubscriptionPoolDto {
  @ApiProperty({ enum: Protein, example: "CHICKEN" })
  @IsEnum(Protein)
  protein!: Protein;

  @ApiProperty({ example: 30000, description: "Total grams purchased for this protein" })
  @IsInt()
  @Min(1)
  totalGrams!: number;
}

// Volume-based subscription: the customer buys a total weight per protein
// (pools) and picks a cadence (deliveryAmountGrams delivered every
// deliveryIntervalDays) — see packages/shared/scheduling.ts's
// generateVolumeSchedule for the derivation of how many deliveries that
// works out to (the last one takes whatever remainder is left).
export class CreateSubscriptionDto {
  @ApiProperty({ example: "f9b69b61-2ad0-4d57-8fb6-787db87eb098" })
  @IsUUID()
  customerId!: string;

  @ApiProperty({ example: "Gói khối lượng tháng 7" })
  @IsString()
  @IsNotEmpty()
  packageName!: string;

  @ApiProperty({ type: [SubscriptionPoolDto], description: "One entry per protein purchased" })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubscriptionPoolDto)
  pools!: SubscriptionPoolDto[];

  @ApiProperty({ example: 1000, description: "Target grams delivered per occurrence, across all proteins" })
  @IsInt()
  @Min(1)
  deliveryAmountGrams!: number;

  @ApiProperty({ example: 1, description: "Days between each delivery" })
  @IsInt()
  @Min(1)
  deliveryIntervalDays!: number;

  @ApiProperty({ example: "2026-07-10" })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    required: false,
    description:
      "Manual price override. If omitted, the server computes a suggested price via the shared discount engine applied across the whole pool purchase.",
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  totalPrice?: number;

  @ApiProperty({ enum: PaymentState, example: "UNPAID", required: false })
  @IsEnum(PaymentState)
  @IsOptional()
  paymentStatus?: PaymentState;
}
