// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsOptional, IsString, IsUUID } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { CreateCashierDto } from "@dtos/cashier/create.dto";

export class CashierDto extends CreateCashierDto {
  @IsUUID()
  id!: string;

  @IsDateString()
  timestamp!: string;

  @IsOptional()
  @IsString()
  receiptKey?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  group?: string;

}
