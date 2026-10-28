import { IsEnum, IsNumber, IsUUID, Min } from "class-validator";

import { ServiceArea } from "@dtos/tips/tips.enum";

export class CreateTipsDto {
  @IsUUID()
  sessionId!: string;

  @IsEnum(ServiceArea)
  area!: ServiceArea;

  @IsNumber()
  @Min(0)
  cashTip!: number;

  @IsNumber()
  @Min(0)
  creditTip!: number;

  @IsNumber()
  @Min(0)
  totalHours!: number;

  @IsNumber()
  @Min(0)
  runnerFeed!: number;
}
