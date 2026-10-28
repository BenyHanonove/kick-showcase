import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Length, Matches, Min } from "class-validator";
import { Type } from "class-transformer";

import { ReservationEventType } from "@dtos/reservation/reservation.enum";

export class CreateReservationDto {
  @IsString()
  @Length(2, 100)
  fullName!: string;

  @IsString()
  @Length(9, 15)
  phone!: string;

  @IsEnum(ReservationEventType, {
    message: `Event type must be one of: ${Object.values(ReservationEventType).join(", ")}`,
  })
  eventType!: ReservationEventType;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "eventDate must be in YYYY-MM-DD format",
  })
  eventDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  guestCount?: number;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  location?: string;

  @IsOptional()
  @IsString()
  @Length(2, 1000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;
}
