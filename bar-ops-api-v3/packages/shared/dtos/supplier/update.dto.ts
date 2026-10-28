// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsOptional, IsString, Length } from "class-validator";

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(9, 15)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  contactName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  address?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;

  @IsDateString()
  timestamp!: string;
}
