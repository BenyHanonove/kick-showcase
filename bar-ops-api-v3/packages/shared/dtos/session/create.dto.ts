// Import external framework dependencies and status codes from third party packages
import { IsEnum, IsISO8601, IsNumber, IsString, IsUUID, Length, Min } from "class-validator";
import { Type } from "class-transformer";

// Import resource data transfer objects for payload transformation and validation
import { SessionType } from "@dtos/session/session.enum";

export class CreateSessionDto {
  @IsUUID()
  clientId!: string;

  @IsISO8601()
  @Type(() => String)
  datetime!: string;

  @IsString()
  @Length(2, 100)
  name!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  peopleAmount!: number;

  @IsString()
  @Length(2, 100)
  location!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  processingFee!: number

  @IsEnum(SessionType, {
    message: `Type must be one of: ${Object.values(SessionType).join(", ")}`,
  })
  type!: SessionType;
}
