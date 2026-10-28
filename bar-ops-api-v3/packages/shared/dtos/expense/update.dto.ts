import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Length, Min } from "class-validator";
import { Type } from "class-transformer";

import { ExpensePaidBy } from "@dtos/expense/expense.enum";

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  desc?: string;

  @IsOptional()
  @IsEnum(ExpensePaidBy)
  paidBy?: ExpensePaidBy;

  @IsOptional()
  @IsBoolean()
  invoice?: boolean;

  @IsOptional()
  @IsBoolean()
  vat?: boolean;

  @IsOptional()
  @IsString()
  receiptKey?: string;

  @IsDateString()
  timestamp!: string;
}
