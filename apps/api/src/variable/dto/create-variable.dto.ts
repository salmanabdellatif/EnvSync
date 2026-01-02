import { IsString, IsNotEmpty, Matches, IsOptional } from 'class-validator';

export class CreateVariableDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z_][A-Z0-9_]*$/, {
    message:
      'Key must be uppercase and contain only letters, numbers, and underscores (e.g., API_KEY)',
  })
  key: string;

  @IsString()
  @IsNotEmpty()
  encryptedValue: string;

  @IsString()
  @IsNotEmpty()
  iv: string;

  @IsString()
  @IsNotEmpty()
  authTag: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
