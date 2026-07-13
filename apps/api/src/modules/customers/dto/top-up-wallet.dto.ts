import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min, IsString, IsOptional } from "class-validator";

// Staff crediting a customer's wallet directly from the admin dashboard —
// see CustomersService.topUpWallet.
export class TopUpWalletDto {
  @ApiProperty({ example: 200000, description: "VND, added to walletBalance" })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiProperty({ example: "Khách chuyển khoản tay, chưa qua tài khoản chính", required: false })
  @IsString()
  @IsOptional()
  note?: string;
}
