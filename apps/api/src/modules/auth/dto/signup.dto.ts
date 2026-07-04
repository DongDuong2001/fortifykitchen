import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class SignupDto {
  @ApiProperty({ example: "customer@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: "Jane" })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: "0901234567" })
  @IsString()
  phone!: string;

  @ApiProperty({ example: "123 Dong Khoi St, District 1" })
  @IsString()
  address!: string;

  @ApiProperty({ example: "Ho Chi Minh City" })
  @IsString()
  city!: string;

  @ApiProperty({ example: "70000" })
  @IsString()
  postalCode!: string;
}
