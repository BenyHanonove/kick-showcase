import { IsDateString, IsEnum, IsISO8601, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from "class-validator";
import { Type } from "class-transformer";

import { SessionStatus, SessionType } from "@dtos/session/session.enum";

export class UpdateSessionDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsISO8601()
  @Type(() => String)
  datetime?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  peopleAmount?: number;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  processingFee?: number;

  @IsOptional()
  @IsEnum(SessionType, {
    message: `Type must be one of: ${Object.values(SessionType).join(", ")}`,
  })
  type?: SessionType;

  @IsOptional()
  @IsEnum(SessionStatus, {
    message: `Status must be one of: ${Object.values(SessionStatus).join(", ")}`,
  })
  status?: SessionStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  barmanAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  waitersAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  barMangerAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  waiterMangerAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  Runners?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  split?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDateString()
  timestamp!: string;
}
