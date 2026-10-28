// Import external framework dependencies and status codes from third party packages
import { IsEnum, IsOptional, IsString, Length } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
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
