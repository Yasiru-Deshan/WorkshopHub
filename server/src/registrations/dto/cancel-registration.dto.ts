import { IsString, IsOptional } from 'class-validator';

export class CancelRegistrationDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
