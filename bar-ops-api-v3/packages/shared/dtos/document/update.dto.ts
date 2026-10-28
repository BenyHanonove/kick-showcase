import { IsDateString, IsOptional, IsString, Length } from "class-validator";

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  desc?: string;

  @IsDateString()
  timestamp!: string;
}
