import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;
}
