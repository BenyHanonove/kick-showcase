// Import external framework dependencies and status codes from third party packages
import { IsEmail, IsString, Length } from "class-validator";

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(8, 100)
  password!: string;
}
