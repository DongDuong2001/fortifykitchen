import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { CustomPlanRequestStatus } from "@fortifykitchen/database";

// Staff-only edit — review notes and/or move the request through its
// lifecycle. Moving to MATCHED normally happens automatically when a
// Subscription is created with this request's id (see
// SubscriptionsService.create's customPlanRequestId handling); this DTO
// covers the manual cases (REVIEWED, DECLINED, or a plain note update).
export class UpdateCustomPlanRequestDto {
  @ApiProperty({ enum: CustomPlanRequestStatus, required: false })
  @IsEnum(CustomPlanRequestStatus)
  @IsOptional()
  status?: CustomPlanRequestStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
