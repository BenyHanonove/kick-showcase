import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { Type } from "class-transformer";

import { CashierLocation } from "@dtos/cashier/cashier.enum";

export class UpdateCashierDto {
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cash?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  credit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  creditTip?: number;

  @IsOptional()
  @IsEnum(CashierLocation, {
    message: `Location must be one of: ${Object.values(CashierLocation).join(", ")}`,
  })
  location?: CashierLocation;

  @IsOptional()
  @IsString()
  receiptKey?: string;

  @IsOptional()
  @IsString()
  group?: string;

  @IsOptional()
  @IsString()
  serial?: string;

  @IsDateString()
  timestamp!: string;
}
