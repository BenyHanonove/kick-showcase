// Import external framework dependencies and status codes from third party packages
import { IsEmail, IsOptional, IsString, Length } from "class-validator";
import { Transform } from "class-transformer";

export class CreateClientDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsString()
  @Length(2, 100)
  brand!: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsEmail()
  email?: string;

  @IsString()
  @Length(9, 15)
  phone!: string;
}
