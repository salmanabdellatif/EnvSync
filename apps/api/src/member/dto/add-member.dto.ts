import { IsEmail, IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { Role } from '../../generated/prisma/client';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  @IsNotEmpty()
  wrappedKey: string; // Project key encrypted with member's public key
}
