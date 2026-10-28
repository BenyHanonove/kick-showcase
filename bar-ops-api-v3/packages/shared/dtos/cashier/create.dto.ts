import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { Type } from "class-transformer";

import { CashierLocation } from "@dtos/cashier/cashier.enum";

export class CreateCashierDto {
  @IsString()
  @IsUUID()
  sessionId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cash!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  credit!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  creditTip!: number;

  @IsEnum(CashierLocation, {
    message: `Location must be one of: ${Object.values(CashierLocation).join(", ")}`,
  })
  location!: CashierLocation;

  @IsOptional()
  @IsString()
  serial?: string;
}
