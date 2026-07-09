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

// One portion-size purchase, e.g. { sizeGrams: 150, qty: 30 } = 30 portions
// of 150g each (4,500g total). This is a real MenuItem SKU size, priced at
// that SKU's actual unit price — not an average price-per-gram.
class SubscriptionPortionDto {
  @ApiProperty({ example: 150, description: "Portion size in grams, matching an existing MenuItem sizeGrams" })
  @IsInt()
  @Min(1)
  sizeGrams!: number;

  @ApiProperty({ example: 30, description: "Number of portions of this size" })
  @IsInt()
  @Min(1)
  qty!: number;
}

// One protein "pool" being purchased in bulk, made up of one or more
// portion-size selections, e.g. { protein: CHICKEN, portions: [{sizeGrams:
// 150, qty: 30}, {sizeGrams: 250, qty: 20}] }. The specific flavor is
// chosen per order occurrence later, not here — see OrdersService.createFromSubscription.
class SubscriptionPoolDto {
  @ApiProperty({ enum: Protein, example: "CHICKEN" })
  @IsEnum(Protein)
  protein!: Protein;

  @ApiProperty({ type: [SubscriptionPortionDto], description: "Portion sizes + counts purchased for this protein" })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubscriptionPortionDto)
  portions!: SubscriptionPortionDto[];
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

  @ApiProperty({
    required: false,
    description: "If this subscription was created to satisfy a customer's custom plan request, link it — marks the request MATCHED.",
  })
  @IsUUID()
  @IsOptional()
  customPlanRequestId?: string;
}
