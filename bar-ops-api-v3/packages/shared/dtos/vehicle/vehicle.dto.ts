// Import external framework dependencies and status codes from third party packages
import { IsArray, IsDateString, IsOptional, IsUUID } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { CreateVehicleDto } from "@dtos/vehicle/create.dto";

export class VehicleDto extends CreateVehicleDto {
  @IsUUID()
  id!: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  passengerShiftIds: string[] = [];

  @IsDateString()
  timestamp!: string;
}
