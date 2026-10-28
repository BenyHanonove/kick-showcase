// Import external framework dependencies and status codes from third party packages
import { IsEnum, IsUUID } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { ShiftRole } from "@dtos/shift/shift.enum";

export class RegisterShiftResultDto {
  @IsUUID()
  id!: string;

  @IsEnum(ShiftRole)
  role!: ShiftRole;
}
