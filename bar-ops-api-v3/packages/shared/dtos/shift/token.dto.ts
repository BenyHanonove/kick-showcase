import { IsString, Length } from "class-validator";

export class ShiftTokenDto {
  @IsString()
  @Length(1, 200)
  token!: string;
}
