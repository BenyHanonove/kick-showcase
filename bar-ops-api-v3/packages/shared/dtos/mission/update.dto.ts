// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsEnum, IsOptional, IsString, Length } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { MissionStatus } from "@dtos/mission/mission.enum";

export class UpdateMissionDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 1000)
  desc?: string;

  @IsOptional()
  @IsEnum(MissionStatus, { message: "סטטוס משימה חייב להיות: pending, working, completed" })
  status?: MissionStatus;

  @IsDateString()
  timestamp!: string;
}
