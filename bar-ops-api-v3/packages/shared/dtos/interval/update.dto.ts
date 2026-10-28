// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsOptional, ValidateIf } from "class-validator";

export class UpdateIntervalDto {
  @IsOptional()
  @ValidateIf((o) => o.start !== "")
  @IsDateString()
  start?: string;

  @IsOptional()
  @ValidateIf((o) => o.end !== "")
  @IsDateString()
  end?: string;

  @IsDateString()
  timestamp!: string;
}
