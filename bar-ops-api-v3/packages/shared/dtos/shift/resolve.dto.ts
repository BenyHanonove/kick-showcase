import { IsBoolean, IsEnum, IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

import { ShiftRole } from "@dtos/shift/shift.enum";
import { ShiftRegistrationEmployeeDto } from "@dtos/shift/registration-employee.dto";
import { ShiftRegistrationSessionDto } from "@dtos/shift/registration-session.dto";

export class ResolveShiftRegistrationDto {
  @ValidateNested()
  @Type(() => ShiftRegistrationEmployeeDto)
  employee!: ShiftRegistrationEmployeeDto;

  @ValidateNested()
  @Type(() => ShiftRegistrationSessionDto)
  session!: ShiftRegistrationSessionDto;

  @IsBoolean()
  registered: boolean = false;

  // Set only when registered, so the confirmation screen names the right role
  @IsOptional()
  @IsEnum(ShiftRole)
  registeredRole?: ShiftRole;
}
