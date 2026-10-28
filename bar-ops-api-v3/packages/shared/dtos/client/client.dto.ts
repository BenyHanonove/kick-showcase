// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsUUID } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { CreateClientDto } from "@dtos/client/create.dto";

export class ClientDto extends CreateClientDto {
  @IsUUID()
  id!: string;

  @IsDateString()
  timestamp!: string;
}
