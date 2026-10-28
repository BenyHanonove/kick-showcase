import { IsString } from "class-validator";

export class ShiftRegistrationEmployeeDto {
  @IsString()
  firstName!: string;
}
