// Import external framework dependencies and status codes from third party packages
import { IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";

// Import resource data transfer objects for payload transformation and validation
import { SaleDto } from "@dtos/sale/sale.dto";

export class SaleSummaryDto extends SaleDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPrice!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  soldPrice!: number;
}
