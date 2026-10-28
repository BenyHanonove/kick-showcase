// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsOptional, IsUUID, ValidateIf } from "class-validator";

export class CreateIntervalDto {
  @IsUUID()
  shiftId!: string;

  @IsUUID()
  sessionId!: string;

  @IsOptional()
  @ValidateIf((o) => o.start !== "")
  @IsDateString()
  start?: string;

  @IsOptional()
  @ValidateIf((o) => o.end !== "")
  @IsDateString()
  end?: string;
}
