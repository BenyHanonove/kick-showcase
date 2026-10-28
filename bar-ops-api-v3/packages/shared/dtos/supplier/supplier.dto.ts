import { IsDateString, IsUUID } from "class-validator";

import { CreateSupplierDto } from "@dtos/supplier/create.dto";

export class SupplierDto extends CreateSupplierDto {
  @IsUUID()
  id!: string;

  @IsDateString()
  timestamp!: string;
}
