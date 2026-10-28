import { IsBoolean, IsDateString, IsUUID } from "class-validator";

import { CreateSaleDto } from "@dtos/sale/create.dto";

export class SaleDto extends CreateSaleDto {
  @IsUUID()
  id!: string;

  @IsBoolean()
  declare paid: boolean;

  @IsDateString()
  timestamp!: string;
}
