import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
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
import { PaymentState, PaymentMethod } from "@fortifykitchen/database";

// Orders are created by staff on behalf of a customer — there is no
// customer self-checkout. Only menuItemId + qty are accepted per line; the
// server looks up the current protein/flavor/size/price for each item and
// runs the shared discount engine (packages/shared/pricing.ts) rather than
// trusting client-supplied prices.
class OrderItemDto {
  @ApiProperty({ example: "f9b69b61-2ad0-4d57-8fb6-787db87eb098" })
  @IsUUID()
  menuItemId!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  qty!: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: "f9b69b61-2ad0-4d57-8fb6-787db87eb098", required: false })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ApiProperty({ example: "2026-07-10" })
  @IsDateString()
  deliveryDate!: string;

  @ApiProperty({ enum: PaymentState, example: "UNPAID", required: false })
  @IsEnum(PaymentState)
  @IsOptional()
  paymentStatus?: PaymentState;

  @ApiProperty({ enum: PaymentMethod, example: "CASH_ON_DELIVERY", required: false })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiProperty({ example: "123 Main St", required: false })
  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @ApiProperty({ example: "Giao trước 10h sáng", required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: "WELCOME10", required: false, description: "Stacks additively with the automatic tier discount" })
  @IsString()
  @IsOptional()
  discountCode?: string;
}
