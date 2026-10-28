// Import external framework dependencies and status codes from third party packages
import { IsOptional, IsString, Length } from "class-validator";

export class CreateSupplierDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsString()
  @Length(9, 15)
  phone!: string;

  @IsString()
  @Length(2, 100)
  contactName!: string;

  @IsString()
  @Length(2, 200)
  address!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}
