// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsUUID } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { CreateIntervalDto } from "@dtos/interval/create.dto";

export class IntervalDto extends CreateIntervalDto {
  @IsUUID()
  id!: string;

  @IsDateString()
  timestamp!: string;
}
