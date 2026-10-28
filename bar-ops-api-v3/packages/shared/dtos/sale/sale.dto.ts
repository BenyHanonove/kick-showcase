// Import external framework dependencies and status codes from third party packages
import { IsBoolean, IsDateString, IsUUID } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { CreateSaleDto } from "@dtos/sale/create.dto";

export class SaleDto extends CreateSaleDto {
  @IsUUID()
  id!: string;

  @IsBoolean()
  declare paid: boolean;

  @IsDateString()
  timestamp!: string;
}
