import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsEnum, IsNumber, Min, IsBoolean, IsDateString, IsOptional, IsInt } from "class-validator";

export class CreateDiscountDto {
  @ApiProperty({ example: "FORTIFY10" })
  @IsString()
  @IsNotEmpty()
  code!: string;

  // Admin-only note on why this code exists — e.g. "Tết 2026 campaign,
  // public" or "Goodwill code for customer X after late delivery". Never
  // shown to the customer; purely so staff can tell codes apart in the
  // admin list without inferring origin from customerId alone.
  @ApiPropertyOptional({ example: "Tết 2026 campaign, public code shared on Facebook" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: "PERCENTAGE", enum: ["PERCENTAGE", "FIXED"] })
  @IsEnum(["PERCENTAGE", "FIXED"])
  type!: "PERCENTAGE" | "FIXED";

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive!: boolean;

  @ApiProperty({ example: "2026-01-01T00:00:00Z" })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: "2026-12-31T23:59:59Z" })
  @IsDateString()
  endsAt!: string;

  // Max total redemptions across all customers, e.g. "only the first 20
  // people who use this code get the discount." Omit/leave blank for
  // unlimited — this is separate from the existing one-use-per-customer
  // rule, which always applies regardless of this limit.
  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;
}
