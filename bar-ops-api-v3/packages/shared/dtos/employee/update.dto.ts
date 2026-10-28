// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsEnum, IsOptional, IsString, Length, Matches } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { EmployeeGender, EmployeeLevel, EmployeeStatus, EmployeeType } from "@dtos/employee/employee.enum";

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{9}$/)
  identityNumber?: string;

  @IsOptional()
  @IsString()
  @Length(9, 15)
  phone?: string;

  @IsOptional()
  @IsEnum(EmployeeType, { message: "סוג עובד חייב להיות: bartender, waiter, hybrid, manager" })
  type?: EmployeeType;

  @IsOptional()
  @IsEnum(EmployeeLevel, { message: "רמת עובד חייבת להיות: trainee, junior, experienced, senior, expert" })
  level?: EmployeeLevel;

  @IsOptional()
  @IsEnum(EmployeeGender, { message: "מגדר חייב להיות: male, female, other" })
  gender?: EmployeeGender;

  @IsOptional()
  @IsString()
  workExperience?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(EmployeeStatus, { message: "סטטוס עובד חייב להיות: PENDING, APPROVED" })
  status?: EmployeeStatus;

  @IsDateString()
  timestamp!: string;
}
