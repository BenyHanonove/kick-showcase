import { IsDateString, IsEnum, IsNumber, IsOptional, Min } from "class-validator";

import { ServiceArea } from "@dtos/tips/tips.enum";

export class UpdateTipsDto {
  @IsOptional()
  @IsEnum(ServiceArea)
  area?: ServiceArea;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cashTip?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditTip?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  runnerFeed?: number;

  @IsDateString()
  timestamp!: string;
}
