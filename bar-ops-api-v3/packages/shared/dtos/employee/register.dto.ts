import { IsEnum } from "class-validator";

import { BaseEmployeeDto } from "@dtos/employee/base.dto";
import { EmployeeGender } from "@dtos/employee/employee.enum";

// Public self-register, gender is required
export class RegisterEmployeeDto extends BaseEmployeeDto {
  @IsEnum(EmployeeGender, { message: "חובה לבחור מגדר: male, female, other" })
  gender!: EmployeeGender;
}
