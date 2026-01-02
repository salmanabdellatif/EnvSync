import { IsEnum } from 'class-validator';
import { Role } from '../../generated/prisma/client';

export class UpdateMemberDto {
  @IsEnum(Role)
  role: Role;
}
