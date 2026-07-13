import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional } from "class-validator";

// Customer asks to move to a higher tier while their current plan discount
// is still active — see SubscriptionPlansService.requestUpgrade.
export class RequestPlanUpgradeDto {
  @ApiProperty({ example: "b3f1c2e4-...", description: "The SubscriptionPlan id the customer wants to move to" })
  @IsString()
  @IsNotEmpty()
  requestedPlanId!: string;

  @ApiProperty({ example: "Muốn tăng khẩu phần vì tập nặng hơn", required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
