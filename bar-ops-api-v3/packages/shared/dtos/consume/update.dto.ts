// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsNumber, IsOptional, Min } from "class-validator";

export class UpdateConsumeDto {

  @IsOptional()
  @IsNumber()
  @Min(0)
  target?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  chargedPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  supplierPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  arrived?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fromStorage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditedToSupplier?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  returnedToStorage?: number;

  @IsDateString()
  timestamp!: string;
}
