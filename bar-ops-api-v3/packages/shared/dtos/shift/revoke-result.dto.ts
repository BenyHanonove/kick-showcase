import { IsNumber, Min } from "class-validator";

export class RevokeShiftRegistrationResultDto {
  @IsNumber()
  @Min(0)
  revoked: number = 0;
}
