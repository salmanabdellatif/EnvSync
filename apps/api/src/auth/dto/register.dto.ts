import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsStrongPassword,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @IsStrongPassword()
  password: string;

  @IsString()
  @MinLength(2)
  @Transform(({ value }) => value.trim())
  name: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
