import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional, IsBoolean } from "class-validator";

export class UpdateSubscriptionPlanDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false, description: "VND, credited 1:1 to wallet balance on purchase" })
  @IsInt()
  @Min(1)
  @IsOptional()
  price?: number;

  @ApiProperty({ required: false, description: "% off voucher granted on purchase" })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  voucherPercent?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
