import { IsDateString, IsUUID } from "class-validator";

import { CreateConsumeDto } from "@dtos/consume/create.dto";

export class ConsumeDto extends CreateConsumeDto {
  @IsUUID()
  id!: string;

  @IsDateString()
  timestamp!: string;
}
