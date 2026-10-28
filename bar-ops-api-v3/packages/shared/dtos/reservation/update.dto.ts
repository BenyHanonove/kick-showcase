// Import external framework dependencies and status codes from third party packages
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Length, Matches, Min } from "class-validator";
import { Type } from "class-transformer";

// Import resource data transfer objects for payload transformation and validation
import { ReservationEventType, ReservationStatus } from "@dtos/reservation/reservation.enum";

export class UpdateReservationDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Length(9, 15)
  phone?: string;

  @IsOptional()
  @IsEnum(ReservationEventType, {
    message: `Event type must be one of: ${Object.values(ReservationEventType).join(", ")}`,
  })
  eventType?: ReservationEventType;

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
  @IsEnum(ReservationStatus, {
    message: `Status must be one of: ${Object.values(ReservationStatus).join(", ")}`,
  })
  status?: ReservationStatus;

  @IsDateString()
  timestamp!: string;
}
