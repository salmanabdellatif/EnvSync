import { IsEmail, IsEnum, IsString, IsOptional } from 'class-validator';
import { Role } from '../../generated/prisma/client';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  @IsOptional()
  wrappedKey?: string; // Optional: granted later via CLI
}
