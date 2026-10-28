import { IsDateString, IsEnum, IsOptional, IsUUID } from "class-validator";

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
