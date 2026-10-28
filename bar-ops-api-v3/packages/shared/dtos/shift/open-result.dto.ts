// Import external framework dependencies and status codes from third party packages
import { IsBoolean, IsDateString, IsString } from "class-validator";

export class OpenShiftRegistrationResultDto {
  @IsString()
  token!: string;

  @IsBoolean()
  sent: boolean = false;

  @IsDateString()
  expiresAt!: string;
}
