import { IsArray, IsDateString, IsOptional, IsUUID } from "class-validator";

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
