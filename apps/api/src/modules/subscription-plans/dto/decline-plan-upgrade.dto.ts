import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class DeclinePlanUpgradeDto {
  @ApiProperty({ example: "Đã liên hệ, khách chưa sẵn sàng nâng cấp", required: false })
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
