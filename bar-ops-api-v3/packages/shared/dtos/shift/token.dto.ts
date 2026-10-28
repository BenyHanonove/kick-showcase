// Import external framework dependencies and status codes from third party packages
import { IsString, Length } from "class-validator";

export class ShiftTokenDto {
  @IsString()
  @Length(1, 200)
  token!: string;
}
