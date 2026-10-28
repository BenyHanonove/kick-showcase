// Import external framework dependencies and status codes from third party packages
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { Type } from "class-transformer";

// Import resource data transfer objects for payload transformation and validation
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
