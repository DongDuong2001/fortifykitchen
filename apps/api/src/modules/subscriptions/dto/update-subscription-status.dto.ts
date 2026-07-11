import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { SubscriptionStatus } from "@fortifykitchen/database";

export class UpdateSubscriptionStatusDto {
  @ApiProperty({ enum: SubscriptionStatus })
  @IsEnum(SubscriptionStatus)
  @IsNotEmpty()
  status!: SubscriptionStatus;
}
