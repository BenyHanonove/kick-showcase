// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsUUID } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { CreateConsumeDto } from "@dtos/consume/create.dto";

export class ConsumeDto extends CreateConsumeDto {
  @IsUUID()
  id!: string;

  @IsDateString()
  timestamp!: string;
}
