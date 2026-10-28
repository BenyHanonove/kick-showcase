// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsEmail, IsOptional, IsString, Length } from "class-validator";
import { Transform } from "class-transformer";

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  brand?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(9, 15)
  phone?: string;

  @IsDateString()
  timestamp!: string;
}
