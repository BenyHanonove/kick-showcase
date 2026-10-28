// Import external framework dependencies and status codes from third party packages
import { IsString } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { SelfUpdateEmployeeDto } from "@dtos/employee/self-update.dto";

export class ClaimEmployeeDto extends SelfUpdateEmployeeDto {
  @IsString()
  token!: string;
}
