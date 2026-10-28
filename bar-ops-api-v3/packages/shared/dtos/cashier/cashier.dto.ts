import { IsDateString, IsOptional, IsString, IsUUID } from "class-validator";

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
