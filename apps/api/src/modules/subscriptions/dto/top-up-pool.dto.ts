import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsInt, Min } from "class-validator";
import { Protein } from "@fortifykitchen/database";

// Adds more purchased weight to a subscription's existing balance for a
// protein (or creates a new pool for a protein the subscription didn't
// originally include). Increments both totalGrams and remainingGrams by
// the same amount — a top-up is new purchased volume, not a correction.
export class TopUpPoolDto {
  @ApiProperty({ enum: Protein, example: "CHICKEN" })
  @IsEnum(Protein)
  protein!: Protein;

  @ApiProperty({ example: 5000, description: "Additional grams purchased for this protein" })
  @IsInt()
  @Min(1)
  grams!: number;
}
