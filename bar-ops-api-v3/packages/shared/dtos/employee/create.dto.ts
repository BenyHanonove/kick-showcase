import { IsEnum, IsOptional } from "class-validator";

import { BaseEmployeeDto } from "@dtos/employee/base.dto";
import { EmployeeGender } from "@dtos/employee/employee.enum";

export class CreateEmployeeDto extends BaseEmployeeDto {
  @IsOptional()
  @IsEnum(EmployeeGender, { message: "מגדר חייב להיות: male, female, other" })
  gender?: EmployeeGender;
}
