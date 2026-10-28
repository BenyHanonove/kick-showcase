// Import external framework dependencies and status codes from third party packages
import { IsBoolean, IsDateString, IsISO8601, IsOptional, IsString, IsUUID, Length } from "class-validator";
import { Type } from "class-transformer";

export class UpdateSaleDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsISO8601()
  @Type(() => String)
  datetime?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @IsDateString()
  timestamp!: string;
}
