import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional } from "class-validator";

// Customer is intentionally independent of any User/login account — staff
// track customers by name/phone/Zalo only, matching the original app.
export class CreateCustomerDto {
  @ApiProperty({ example: "Nguyễn Văn A" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "0901234567", required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: "nguyenvana.zalo", required: false })
  @IsString()
  @IsOptional()
  zalo?: string;

  @ApiProperty({ example: "123 Đồng Khởi, Quận 1", required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: "Dị ứng tôm", required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
