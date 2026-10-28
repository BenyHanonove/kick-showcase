import { IsDateString, IsUUID } from "class-validator";

import { CreateTipsDto } from "@dtos/tips/create.dto";

export class TipsDto extends CreateTipsDto {
  @IsUUID()
  id!: string;

  @IsDateString()
  timestamp!: string;
}
