import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsDateString, IsNumber, Min } from "class-validator";
import { SubscriptionFrequency } from "@fortifykitchen/types";

export class CreateSubscriptionDto {
  @ApiProperty({ example: "WEEKLY", enum: ["DAILY", "WEEKLY", "MONTHLY"] })
  @IsEnum(["DAILY", "WEEKLY", "MONTHLY"])
  frequency!: SubscriptionFrequency;

  @ApiProperty({ example: "2026-07-05T00:00:00Z" })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: 450000 }) // E.g. in VND per cycle
  @IsNumber()
  @Min(0)
  pricePerCycle!: number;
}
