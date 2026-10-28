import { IsDateString, IsOptional, IsString, IsUUID } from "class-validator";

import { CreateExpenseDto } from "@dtos/expense/create.dto";

export class ExpenseDto extends CreateExpenseDto {
  @IsUUID()
  id!: string;

  @IsDateString()
  timestamp!: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;
}
