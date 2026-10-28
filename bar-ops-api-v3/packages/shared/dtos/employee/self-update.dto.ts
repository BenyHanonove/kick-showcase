import { IsDateString, IsEnum, IsString, Length, Matches } from "class-validator";

import { EmployeeGender } from "@dtos/employee/employee.enum";

export class SelfUpdateEmployeeDto {
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

  @IsString()
  workExperience!: string;

  @IsString()
  instagram!: string;

  @IsString()
  address!: string;

  @IsEnum(EmployeeGender, { message: "חובה לבחור מגדר: male, female, other" })
  gender!: EmployeeGender;

  @IsDateString()
  timestamp!: string;
}
