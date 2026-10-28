// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsUUID } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { CreateTipsDto } from "@dtos/tips/create.dto";

export class TipsDto extends CreateTipsDto {
  @IsUUID()
  id!: string;

  @IsDateString()
  timestamp!: string;
}
