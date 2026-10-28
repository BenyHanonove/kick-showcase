import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

import { ShiftRole, ShiftRegistration } from "@dtos/shift/shift.enum";

export class UpdateShiftDto {
  @IsOptional()
  @IsEnum(ShiftRole)
  role?: ShiftRole;

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

  @IsOptional()
  @IsNumber()
  hourly?: number | null;

  @IsOptional()
  @IsBoolean()
  received?: boolean;

  @IsOptional()
  @IsBoolean()
  approved?: boolean;

  @IsOptional()
  @IsEnum(ShiftRegistration, { message: "סטטוס הרשמה חייב להיות: PENDING, APPROVED, REJECTED" })
  registration?: ShiftRegistration;

  @IsOptional()
  @IsString()
  notes?: string

  @IsDateString()
  timestamp!: string;
}
