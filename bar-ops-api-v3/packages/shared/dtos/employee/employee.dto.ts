import { IsDateString, IsEnum, IsUUID } from "class-validator";

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
