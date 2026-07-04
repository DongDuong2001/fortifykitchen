import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsBoolean, IsUUID } from "class-validator";

export class CreateMenuItemDto {
  @ApiProperty({ example: "Avocado & Salmon Bowl" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "Fresh avocado, smoked salmon, wild rice, and mixed greens with sesame dressing." })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 120000 }) // Example in VND
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: "https://example.com/salmon-bowl.jpg", required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: "f9b69b61-2ad0-4d57-8fb6-787db87eb098" })
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
