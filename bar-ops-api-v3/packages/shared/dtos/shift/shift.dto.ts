import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

import { CreateShiftDto } from "@dtos/shift/create.dto";
import { ShiftRegistration } from "@dtos/shift/shift.enum";

export class ShiftDto extends CreateShiftDto {
  @IsUUID()
  id!: string;

  @IsNumber()
  totalHours: number = 0;

  @IsOptional()
  @IsNumber()
  hourly?: number | null;

  @IsBoolean()
  received: boolean = false;

  @IsBoolean()
  approved: boolean = false;

  // Rows created before this field read as approved
  @IsEnum(ShiftRegistration)
  registration: ShiftRegistration = ShiftRegistration.APPROVED;

  @IsOptional()
  @IsString()
  notes?: string

  @IsDateString()
  timestamp!: string;
}
