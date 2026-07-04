import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsEnum, IsNumber, Min, IsBoolean, IsDateString } from "class-validator";

export class CreateDiscountDto {
  @ApiProperty({ example: "FORTIFY10" })
  @IsString()
  @IsNotEmpty()
  code!: string;

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
}
