import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { Type } from "class-transformer";

import { CreateSessionDto } from "@dtos/session/create.dto";
import { SessionStatus } from "@dtos/session/session.enum";

export class SessionDto extends CreateSessionDto {
  @IsUUID()
  id!: string;

  // Default for legacy items saved before processingFee existed
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  override processingFee: number = 2;

  @IsEnum(SessionStatus, {
    message: `Status must be one of: ${Object.values(SessionStatus).join(", ")}`,
  })
  status: SessionStatus = SessionStatus.ACTIVE;

  @IsDateString()
  timestamp!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  barmanAmount: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  waitersAmount: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  barMangerAmount: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  waiterMangerAmount: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  Runners: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  split?: number;

  @IsOptional()
  @IsString()
  notes?: string;

}
