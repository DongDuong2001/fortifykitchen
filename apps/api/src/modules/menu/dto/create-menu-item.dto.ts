import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsEnum,
} from "class-validator";
import { Protein } from "@fortifykitchen/database";

// A sellable SKU: one protein + flavor + portion size combination
// (e.g. chicken / xá xíu / 150g). Mirrors the MenuItem model in
// packages/database/prisma/schema.prisma — price is whole VND, no subunit.
export class CreateMenuItemDto {
  @ApiProperty({ enum: Protein, example: "CHICKEN" })
  @IsEnum(Protein)
  protein!: Protein;

  @ApiProperty({ example: "xá xíu" })
  @IsString()
  @IsNotEmpty()
  flavor!: string;

  @ApiProperty({ example: 150 })
  @IsInt()
  @Min(1)
  sizeGrams!: number;

  @ApiProperty({ example: 25000, description: "Price in whole VND" })
  @IsInt()
  @Min(0)
  price!: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiProperty({
    example: 0,
    required: false,
    description: "Portions prepped and ready right now (0 = needs prep)",
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
