import { ApiProperty } from "@nestjs/swagger";

export class CronJobResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: "Processed 5 renewals, 0 failed" })
  message!: string;

  @ApiProperty({ example: 5 })
  processed!: number;

  @ApiProperty({ example: 0 })
  failed!: number;

  @ApiProperty({ example: [] })
  errors!: string[];

  @ApiProperty({ example: 1250 })
  duration!: number;
}