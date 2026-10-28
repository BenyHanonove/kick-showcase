import { IsString, IsUUID, Length } from "class-validator";

export class NotifyEmployeeDto {
  @IsUUID()
  employeeId!: string;

  @IsString()
  @Length(1, 1000)
  text!: string;
}
