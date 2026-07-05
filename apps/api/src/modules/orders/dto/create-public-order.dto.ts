import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsInt,
  IsUUID,
  IsDateString,
  ArrayMinSize,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";
import { PaymentMethod } from "@fortifykitchen/database";

class PublicOrderItemDto {
  @ApiProperty({ example: "f9b69b61-2ad0-4d57-8fb6-787db87eb098" })
  @IsUUID()
  menuItemId!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  qty!: number;
}

// Customer self-checkout — there is no customer login system yet, so the
// phone number doubles as identity: an existing Customer with this phone is
// reused, otherwise a new one is created on the fly (mirroring how staff
// create ad-hoc customers today). deliveryDate is optional: the storefront's
// "Order Now" flow (in-stock items only) doesn't show a date picker at all,
// since IMMEDIATE orders are always forced to today server-side anyway (see
// OrdersService.create) — deliveryDate only matters if the order ends up
// SCHEDULED (some item turned out to need prep after all).
export class CreatePublicOrderDto {
  @ApiProperty({ example: "Nguyễn Văn A" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "0901234567" })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ type: [PublicOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PublicOrderItemDto)
  items!: PublicOrderItemDto[];

  @ApiProperty({
    example: "2026-07-10",
    required: false,
    description: "Only used as a fallback if the order can't be fulfilled immediately",
  })
  @IsDateString()
  @IsOptional()
  deliveryDate?: string;

  @ApiProperty({ enum: PaymentMethod, example: "CASH_ON_DELIVERY", required: false })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
