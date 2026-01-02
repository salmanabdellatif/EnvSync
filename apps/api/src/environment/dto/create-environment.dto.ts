import { IsNotEmpty, IsString, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEnvironmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Transform(({ value }) => value?.trim().toLowerCase())
  @Matches(/^[a-z0-9_-]+$/, {
    message:
      'Name can only contain lowercase letters, numbers, underscores, and dashes',
  })
  name: string;
}
