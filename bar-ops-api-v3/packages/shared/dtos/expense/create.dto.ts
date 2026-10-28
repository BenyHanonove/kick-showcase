import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from "class-validator";
import { Type } from "class-transformer";

import { ExpensePaidBy } from "@dtos/expense/expense.enum";

export class CreateExpenseDto {
  @IsUUID()
  sessionId!: string;

  @IsString()
  @Length(2, 50)
  name!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  @IsOptional()
  @Length(0, 200)
  desc?: string;

  @IsOptional()
  @IsEnum(ExpensePaidBy)
  paidBy?: ExpensePaidBy = ExpensePaidBy.HOUSE;

  @IsOptional()
  @IsBoolean()
  invoice?: boolean;

  @IsOptional()
  @IsBoolean()
  vat?: boolean;

  @IsOptional()
  @IsString()
  receiptKey?: string;
}
