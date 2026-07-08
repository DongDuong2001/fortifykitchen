import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean } from "class-validator";

export class CreateHomeFrameDto {
  @ApiProperty({ example: "Giảm Giá Mùa Hè", required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: "https://res.cloudinary.com/.../banner1.jpg" })
  @IsString()
  @IsNotEmpty()
  imageUrl!: string;

  @ApiProperty({ example: "/menu", required: false })
  @IsString()
  @IsOptional()
  linkUrl?: string;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
