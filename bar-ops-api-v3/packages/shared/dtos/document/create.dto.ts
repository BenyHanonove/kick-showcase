// Import external framework dependencies and status codes from third party packages
import { IsOptional, IsString, IsUUID, Length } from "class-validator";

export class CreateDocumentDto {
  @IsUUID()
  sessionId!: string;

  @IsString()
  @Length(1, 255)
  name!: string;

  @IsString()
  contentType!: string;

  @IsString()
  file!: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  desc?: string;
}
