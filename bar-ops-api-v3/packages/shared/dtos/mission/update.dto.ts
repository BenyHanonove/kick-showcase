import { IsDateString, IsEnum, IsOptional, IsString, Length } from "class-validator";

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
