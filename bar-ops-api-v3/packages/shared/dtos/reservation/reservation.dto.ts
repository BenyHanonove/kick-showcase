// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsEnum, IsOptional, IsUUID } from "class-validator";

// Import resource data transfer objects for payload transformation and validation
import { CreateReservationDto } from "@dtos/reservation/create.dto";
import { ReservationStatus } from "@dtos/reservation/reservation.enum";

export class ReservationDto extends CreateReservationDto {
  @IsUUID()
  id!: string;

  @IsEnum(ReservationStatus)
  status: ReservationStatus = ReservationStatus.NEW;

  @IsDateString()
  timestamp!: string;

  @IsOptional()
  @IsDateString()
  marketingConsentAt?: string;
}
