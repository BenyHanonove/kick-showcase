// Import external framework dependencies and status codes from third party packages
import { IsEnum, IsOptional } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { BaseEmployeeDto } from "@dtos/employee/base.dto";
import { EmployeeGender } from "@dtos/employee/employee.enum";

export class CreateEmployeeDto extends BaseEmployeeDto {
  @IsOptional()
  @IsEnum(EmployeeGender, { message: "מגדר חייב להיות: male, female, other" })
  gender?: EmployeeGender;
}
