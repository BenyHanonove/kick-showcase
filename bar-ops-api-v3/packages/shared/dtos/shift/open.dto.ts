import { IsUUID } from "class-validator";

export class OpenShiftRegistrationDto {
  @IsUUID()
  employeeId!: string;
}
