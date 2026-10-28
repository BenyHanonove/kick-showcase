// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from "class-validator";
import { Type } from "class-transformer";

export class DocumentDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  sessionId!: string;

  @IsString()
  @Length(1, 255)
  name!: string;

  @IsString()
  contentType!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  size!: number;

  @IsString()
  key!: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  desc?: string;

  @IsDateString()
  timestamp!: string;
}
