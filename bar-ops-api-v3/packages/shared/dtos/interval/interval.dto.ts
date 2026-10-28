import { IsDateString, IsUUID } from "class-validator";

import { CreateIntervalDto } from "@dtos/interval/create.dto";

export class IntervalDto extends CreateIntervalDto {
  @IsUUID()
  id!: string;

  @IsDateString()
  timestamp!: string;
}
