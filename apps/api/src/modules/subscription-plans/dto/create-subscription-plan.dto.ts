import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional, IsBoolean, IsArray } from "class-validator";

// A purchasable price tier (e.g. "Gói 1.5 triệu") — buying one credits
// Customer.walletBalance by `price` and issues a percentage-off Discount
// voucher sized by `voucherPercent`. Staff-managed catalog, mirrors the
// admin-only shape of Discount creation. See docs/plan-and-credit-design.md.
export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: "Gói 1.5 triệu" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 1500000, description: "VND, credited 1:1 to wallet balance on purchase" })
  @IsInt()
  @Min(1)
  price!: number;

  @ApiProperty({ example: 5, description: "% off voucher granted on purchase", required: false, default: 0 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  voucherPercent?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, default: [], description: "Itemised benefits / inclusions for this plan tier" })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

