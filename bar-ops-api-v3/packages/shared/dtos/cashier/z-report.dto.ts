// Import external framework dependencies and status codes from third party packages
import { IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

// Import resource data transfer objects for payload transformation and validation
import { CreateCashierDto } from "@dtos/cashier/create.dto";

export class ZReportDto {
  @IsString()
  csvContent!: string;

  @ValidateNested()
  @Type(() => CreateCashierDto)
  cashierDto!: CreateCashierDto;
}
