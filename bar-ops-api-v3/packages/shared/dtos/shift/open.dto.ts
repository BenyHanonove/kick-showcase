// Import external framework dependencies and status codes from third party packages
import { IsUUID } from "class-validator";

export class OpenShiftRegistrationDto {
  @IsUUID()
  employeeId!: string;
}
