import { IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateVehicleDto {
  @IsUUID()
  sessionId!: string;

  @IsOptional()
  @IsString()
  desc?: string;

  @IsOptional()
  @IsUUID()
  driverShiftId?: string;

  @IsNumber()
  sum!: number;

  @IsOptional()
  @IsString()
  licensePlate?: string;
}
