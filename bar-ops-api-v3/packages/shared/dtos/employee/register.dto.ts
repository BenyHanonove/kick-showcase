// Import external framework dependencies and status codes from third party packages
import { IsEnum } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { BaseEmployeeDto } from "@dtos/employee/base.dto";
import { EmployeeGender } from "@dtos/employee/employee.enum";

// Public self-register, gender is required
export class RegisterEmployeeDto extends BaseEmployeeDto {
  @IsEnum(EmployeeGender, { message: "חובה לבחור מגדר: male, female, other" })
  gender!: EmployeeGender;
}
