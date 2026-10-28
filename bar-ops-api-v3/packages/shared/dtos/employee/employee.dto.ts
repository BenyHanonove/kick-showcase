// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsEnum, IsUUID } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { CreateEmployeeDto } from "@dtos/employee/create.dto";
import { EmployeeStatus } from "@dtos/employee/employee.enum";

export class EmployeeDto extends CreateEmployeeDto {
  @IsUUID()
  id!: string;

  @IsEnum(EmployeeStatus)
  status!: EmployeeStatus;

  @IsDateString()
  timestamp!: string;
}
