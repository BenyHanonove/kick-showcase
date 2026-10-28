// Import external framework dependencies and status codes from third party packages
import { IsISO8601, IsString } from "class-validator";

export class ShiftRegistrationSessionDto {
  @IsString()
  name!: string;

  @IsString()
  brand!: string;

  @IsISO8601()
  datetime!: string;

  @IsString()
  location!: string;
}
