// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsEnum, IsString, IsUUID } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { CreateMissionDto } from "@dtos/mission/create.dto";
import { MissionStatus } from "@dtos/mission/mission.enum";

export class MissionDto extends CreateMissionDto {
  @IsUUID()
  id!: string;

  @IsEnum(MissionStatus)
  status: MissionStatus = MissionStatus.PENDING;

  @IsDateString()
  timestamp!: string;

  @IsString()
  declare monthYear: string;
}
