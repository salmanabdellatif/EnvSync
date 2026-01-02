import { IsString, IsOptional, Length } from 'class-validator';
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;
  @IsOptional()
  @IsString()
  avatar?: string;
}
