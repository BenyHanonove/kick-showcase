// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsOptional, IsString, IsUUID } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
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
