import { IsString, IsUUID, Length } from "class-validator";

export class CreateMissionDto {
  @IsUUID()
  sessionId!: string;

  @IsString()
  @Length(2, 100)
  name!: string;

  @IsString()
  @Length(2, 1000)
  desc!: string;
}
