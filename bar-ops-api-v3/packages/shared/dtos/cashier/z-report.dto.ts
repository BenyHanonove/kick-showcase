import { IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

import { CreateCashierDto } from "@dtos/cashier/create.dto";

export class ZReportDto {
  @IsString()
  csvContent!: string;

  @ValidateNested()
  @Type(() => CreateCashierDto)
  cashierDto!: CreateCashierDto;
}
