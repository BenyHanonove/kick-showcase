import { IsISO8601, IsString, IsUUID, Length } from "class-validator";
import { Type } from "class-transformer";

export class CreateSaleDto {
  @IsUUID()
  clientId!: string;

  @IsISO8601()
  @Type(() => String)
  datetime!: string;

  @IsString()
  @Length(2, 100)
  name!: string;

  // not received from client; always defaults to false on create
  paid: boolean = false;
}
