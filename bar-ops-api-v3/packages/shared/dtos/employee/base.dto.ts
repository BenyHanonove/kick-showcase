// Import external framework dependencies and status codes from third party packages
import { IsEnum, IsOptional, IsString, Length, Matches } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { EmployeeLevel, EmployeeType } from "@dtos/employee/employee.enum";

// Shared employee fields, gender is set per flow
export class BaseEmployeeDto {
  @IsString()
  @Length(2, 50)
  firstName!: string;

  @IsString()
  @Length(2, 50)
  lastName!: string;

  @IsString()
  @Matches(/^[0-9]{9}$/, { message: "תעודת זהות חייבת להכיל 9 ספרות בדיוק" })
  identityNumber!: string;

  @IsString()
  @Length(9, 15)
  phone!: string;

  @IsOptional()
  @IsEnum(EmployeeType, { message: "סוג עובד חייב להיות: bartender, waiter, hybrid, manager" })
  type?: EmployeeType;

  @IsOptional()
  @IsEnum(EmployeeLevel, { message: "רמת עובד חייבת להיות: trainee, junior, experienced, senior, expert" })
  level?: EmployeeLevel;

  @IsOptional()
  @IsString()
  workExperience?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
