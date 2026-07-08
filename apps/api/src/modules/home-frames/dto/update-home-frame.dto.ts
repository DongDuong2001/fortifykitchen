import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsInt, IsBoolean } from "class-validator";

export class UpdateHomeFrameDto {
  @ApiProperty({ example: "Giảm Giá Mùa Hè", required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: "https://res.cloudinary.com/.../banner1.jpg", required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

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
