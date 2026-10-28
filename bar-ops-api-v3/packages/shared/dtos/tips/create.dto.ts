// Import external framework dependencies and status codes from third party packages
import { IsEnum, IsNumber, IsUUID, Min } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
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
