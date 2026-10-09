import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, IsDateString } from 'class-validator';
import { WorkshopStatus } from '../entities/workshop.entity';

export class CreateWorkshopDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  instructor: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  starts_at: string;

  @IsDateString()
  ends_at: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsEnum(WorkshopStatus)
  @IsOptional()
  status?: WorkshopStatus;
}
