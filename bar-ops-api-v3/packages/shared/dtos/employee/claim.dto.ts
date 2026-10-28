import { IsString } from "class-validator";

import { SelfUpdateEmployeeDto } from "@dtos/employee/self-update.dto";

export class ClaimEmployeeDto extends SelfUpdateEmployeeDto {
  @IsString()
  token!: string;
}
