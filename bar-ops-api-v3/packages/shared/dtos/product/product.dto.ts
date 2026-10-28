// Import external framework dependencies and status codes from third party packages
import { IsBoolean, IsDateString, IsUUID } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { CreateProductDto } from "@dtos/product/create.dto";

export class ProductDto extends CreateProductDto {
  @IsUUID()
  id!: string;

  @IsBoolean()
  declare isBase: boolean;

  @IsDateString()
  timestamp!: string;
}
