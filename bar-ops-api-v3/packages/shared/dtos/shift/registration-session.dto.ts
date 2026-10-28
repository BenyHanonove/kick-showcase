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
