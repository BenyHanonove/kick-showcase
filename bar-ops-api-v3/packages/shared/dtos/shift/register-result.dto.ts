import { IsEnum, IsUUID } from "class-validator";

import { ShiftRole } from "@dtos/shift/shift.enum";

export class RegisterShiftResultDto {
  @IsUUID()
  id!: string;

  @IsEnum(ShiftRole)
  role!: ShiftRole;
}
