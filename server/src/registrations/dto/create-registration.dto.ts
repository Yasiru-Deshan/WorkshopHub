import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRegistrationDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  attendeeName: string;

  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toLowerCase())
  attendeeEmail: string;
}
