import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsEnum, Min, IsInt, IsUUID } from "class-validator";
import { Type } from "class-transformer";
import { PaymentMethod } from "@fortifykitchen/types";

class OrderItemDto {
  @ApiProperty({ example: "f9b69b61-2ad0-4d57-8fb6-787db87eb098" })
  @IsUUID()
  menuItemId!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: "No onions", required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ApiProperty({ example: "123 Dong Khoi St, District 1" })
  @IsString()
  @IsNotEmpty()
  deliveryAddress!: string;

  @ApiProperty({ example: "Please ring the bell", required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: "CASH_ON_DELIVERY", enum: ["CREDIT_CARD", "DEBIT_CARD", "PAYPAL", "STRIPE", "CASH_ON_DELIVERY"] })
  @IsEnum(["CREDIT_CARD", "DEBIT_CARD", "PAYPAL", "STRIPE", "CASH_ON_DELIVERY"])
  paymentMethod!: PaymentMethod;

  @ApiProperty({ example: "FORTIFY10", required: false })
  @IsString()
  @IsOptional()
  discountCode?: string;
}
