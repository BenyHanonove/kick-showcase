import { IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";

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
