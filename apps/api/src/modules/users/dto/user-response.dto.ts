import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@fortifykitchen/types";

export class UserResponseDto {
  @ApiProperty({ example: "f9b69b61-2ad0-4d57-8fb6-787db87eb098" })
  id!: string;

  @ApiProperty({ example: "user@example.com" })
  email!: string;

  @ApiProperty({ example: "John" })
  firstName!: string;

  @ApiProperty({ example: "Doe" })
  lastName!: string;

  @ApiProperty({ example: "CUSTOMER" })
  role!: UserRole;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
