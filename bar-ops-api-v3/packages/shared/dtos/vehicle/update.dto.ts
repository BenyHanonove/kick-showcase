// Import external framework dependencies and status codes from third party packages
import { IsArray, IsDateString, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  desc?: string;

  @IsOptional()
  @IsUUID()
  driverShiftId?: string;

  @IsOptional()
  @IsNumber()
  sum?: number;

  @IsOptional()
  @IsString()
  licensePlate?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  passengerShiftIds?: string[];

  @IsDateString()
  timestamp!: string;
}
