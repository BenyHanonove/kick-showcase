import { IsEnum, IsNotEmpty, IsString, IsUUID, Matches } from "class-validator";

import { CashierLocation } from "@dtos/cashier/cashier.enum";

export class PresignZReportDto {
  @IsString()
  @IsNotEmpty()
  file!: string;

  // Simple filename ending in .csv, no path separators
  @IsString()
  @Matches(/^[^/\\]+\.csv$/, { message: 'Filename must be a .csv file without path separators' })
  filename!: string;

  @IsUUID()
  sessionId!: string;

  @IsEnum(CashierLocation, {
    message: `Location must be one of: ${Object.values(CashierLocation).join(", ")}`,
  })
  location!: CashierLocation;
}
