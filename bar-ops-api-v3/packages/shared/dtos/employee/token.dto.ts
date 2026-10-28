// Import external framework dependencies and status codes from third party packages
import { IsString } from "class-validator";

export class EmployeeTokenDto {
  @IsString()
  token!: string;
}
