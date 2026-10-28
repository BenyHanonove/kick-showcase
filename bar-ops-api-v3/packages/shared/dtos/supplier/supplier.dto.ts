// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsUUID } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { CreateSupplierDto } from "@dtos/supplier/create.dto";

export class SupplierDto extends CreateSupplierDto {
  @IsUUID()
  id!: string;

  @IsDateString()
  timestamp!: string;
}
