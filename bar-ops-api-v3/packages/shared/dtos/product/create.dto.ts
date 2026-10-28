// Import external framework dependencies and status codes from third party packages
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from "class-validator";
import { Transform, Type } from "class-transformer";

// Import resource data transfer objects for payload transformation and validation
import { ProductType } from "@dtos/product/product.enum";

export class CreateProductDto {
  @IsUUID()
  supplierId!: string;

  @IsString()
  @Length(2, 50)
  name!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  volume!: number;

  @IsEnum(ProductType, {
    message:
      "Type must be: alcohol, soda, energy_drink, equipment, disposable, or accompanying",
  })
  type!: ProductType;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isBase: boolean = false;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number = 0;
}
