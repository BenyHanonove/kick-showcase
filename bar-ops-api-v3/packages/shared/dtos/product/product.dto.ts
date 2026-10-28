import { IsBoolean, IsDateString, IsUUID } from "class-validator";

import { CreateProductDto } from "@dtos/product/create.dto";

export class ProductDto extends CreateProductDto {
  @IsUUID()
  id!: string;

  @IsBoolean()
  declare isBase: boolean;

  @IsDateString()
  timestamp!: string;
}
