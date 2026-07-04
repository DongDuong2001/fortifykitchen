import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateCategoryDto {
  @ApiProperty({ example: "Salads" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "salads" })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiProperty({ example: "Fresh organic salads", required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
