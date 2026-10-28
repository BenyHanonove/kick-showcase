import { IsDateString, IsOptional, IsString } from 'class-validator';

// Minimal DTO for exercising the generic DynamoDB helpers
export class WidgetDto {
    @IsString()
    id!: string;

    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    datetime?: string;

    @IsOptional()
    @IsDateString()
    timestamp?: string;
}
