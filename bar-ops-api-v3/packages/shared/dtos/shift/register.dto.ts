import { IsEnum, IsOptional, IsString, Length } from "class-validator";

import { ShiftRole } from "@dtos/shift/shift.enum";
import { ShiftTokenDto } from "@dtos/shift/token.dto";

export class RegisterShiftDto extends ShiftTokenDto {
  @IsEnum(ShiftRole)
  role!: ShiftRole;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}
