// Import external framework dependencies and status codes from third party packages
import { IsBoolean, IsDateString, IsISO8601, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export class ShiftRegistrationTokenDto {
  @IsUUID()
  id!: string;

  @IsString()
  token!: string;

  @IsUUID()
  sessionId!: string;

  @IsUUID()
  employeeId!: string;

  @IsString()
  firstName!: string;

  @IsString()
  name!: string;

  @IsString()
  brand!: string;

  @IsISO8601()
  datetime!: string;

  @IsString()
  location!: string;

  // Epoch seconds, doubles as the DynamoDB TTL attribute
  @IsNumber()
  expiresAt!: number;

  @IsBoolean()
  used: boolean = false;

  @IsDateString()
  createdAt!: string;

  @IsOptional()
  @IsString()
  createdBy?: string;
}
