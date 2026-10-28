// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsEnum, IsNumber, IsOptional, IsUUID } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { ShiftRole } from "@dtos/shift/shift.enum";

export class CreateShiftDto {
  @IsUUID()
  sessionId!: string;

  @IsUUID()
  employeeId!: string;

  @IsEnum(ShiftRole)
  role!: ShiftRole;

  @IsOptional()
  @IsDateString()
  timing?: string;

  @IsOptional()
  @IsNumber()
  bonusTravel?: number;

  @IsOptional()
  @IsNumber()
  bonusManage?: number;

  @IsOptional()
  @IsNumber()
  bonusOther?: number;

  @IsOptional()
  @IsNumber()
  bonusSetup?: number;
}
