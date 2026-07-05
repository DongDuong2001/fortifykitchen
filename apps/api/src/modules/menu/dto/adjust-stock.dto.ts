import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, Min } from "class-validator";

// Two ways to change stock: set an absolute value (e.g. after a physical
// recount) or apply a signed delta (e.g. "+20 just came out of the kitchen",
// "-3 spoiled"). Exactly one of the two should be sent; the service prefers
// `set` if both are present.
export class AdjustStockDto {
  @ApiProperty({ example: 20, required: false, description: "Set stock to this exact value" })
  @IsInt()
  @Min(0)
  @IsOptional()
  set?: number;

  @ApiProperty({
    example: 5,
    required: false,
    description: "Add (positive) or remove (negative) this many portions from current stock",
  })
  @IsInt()
  @IsOptional()
  delta?: number;
}
