// Import external framework dependencies and status codes from third party packages
import { IsNumber, Min } from "class-validator";

export class RevokeShiftRegistrationResultDto {
  @IsNumber()
  @Min(0)
  revoked: number = 0;
}
