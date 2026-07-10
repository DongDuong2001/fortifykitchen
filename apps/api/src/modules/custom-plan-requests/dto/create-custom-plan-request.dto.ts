import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsInt, Min, IsUUID } from "class-validator";
import { Protein } from "@fortifykitchen/database";

// A customer's ask for a plan outside the standard catalog — always a
// consultation request, never a binding order (see CustomPlanRequest in
// schema.prisma). Reachable both from the public storefront (no
// customerId, just name/phone) and from an authenticated customer session
// (customerId resolved server-side from the JWT, same pattern as
// CreateOrderDto).
export class CreateCustomPlanRequestDto {
  @ApiProperty({ example: "f9b69b61-2ad0-4d57-8fb6-787db87eb098", required: false })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ example: "Nguyễn Văn A" })
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiProperty({ example: "0901234567", required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: Protein, isArray: true, required: false })
  @IsArray()
  @IsEnum(Protein, { each: true })
  @IsOptional()
  desiredProteins?: Protein[];

  @ApiProperty({ required: false, description: "Rough total weight in grams the customer is picturing, if they gave one" })
  @IsInt()
  @Min(1)
  @IsOptional()
  estimatedTotalGrams?: number;

  @ApiProperty({ required: false, description: "Rough delivery cadence in days, if they gave one" })
  @IsInt()
  @Min(1)
  @IsOptional()
  preferredIntervalDays?: number;

  @ApiProperty({ required: false, description: "Rough budget in VND, if they gave one" })
  @IsInt()
  @Min(0)
  @IsOptional()
  budgetHint?: number;

  @ApiProperty({ required: false, example: "Muốn tăng cơ, ít tinh bột, giao 3 lần/tuần buổi sáng." })
  @IsString()
  @IsOptional()
  notes?: string;
}
