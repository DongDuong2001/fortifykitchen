import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsObject } from "class-validator";

export class UpdateCustomerDto {
  @ApiProperty({ example: "0901234567", required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: "123 Dong Khoi St, District 1", required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: "Ho Chi Minh City", required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: "70000", required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ example: { dietary: "vegetarian" }, required: false })
  @IsObject()
  @IsOptional()
  preferences?: Record<string, any>;
}
