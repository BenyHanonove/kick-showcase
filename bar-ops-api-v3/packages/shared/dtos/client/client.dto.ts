import { IsDateString, IsUUID } from "class-validator";

import { CreateClientDto } from "@dtos/client/create.dto";

export class ClientDto extends CreateClientDto {
  @IsUUID()
  id!: string;

  @IsDateString()
  timestamp!: string;
}
