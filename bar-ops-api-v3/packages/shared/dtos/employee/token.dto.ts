import { IsString } from "class-validator";

export class EmployeeTokenDto {
  @IsString()
  token!: string;
}
