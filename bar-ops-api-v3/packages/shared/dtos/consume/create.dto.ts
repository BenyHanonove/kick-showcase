// Import external framework dependencies and status codes from third party packages
import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsUUID, Min } from "class-validator";

export class CreateConsumeDto {
  @IsUUID()
  sessionId!: string;

  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value === null || value === undefined ? 0 : value))
  chargedPrice: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value === null || value === undefined ? 0 : value))
  supplierPrice: number = 0;

  @IsNumber()
  @Min(0)
  target!: number;

  @IsNumber()
  @Min(0)
  order!: number;

  @IsNumber()
  @Min(0)
  arrived!: number;

  @IsNumber()
  @Min(0)
  fromStorage!: number;

  @IsNumber()
  @Min(0)
  creditedToSupplier!: number;

  @IsNumber()
  @Min(0)
  returnedToStorage!: number;
}
