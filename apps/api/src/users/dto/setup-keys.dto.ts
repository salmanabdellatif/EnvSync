import { IsString, IsNotEmpty } from 'class-validator';

export class SetupKeysDto {
  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @IsString()
  @IsNotEmpty()
  encryptedPrivateKey: string;

  @IsString()
  @IsNotEmpty()
  encryptionSalt: string;

  @IsString()
  @IsNotEmpty()
  encryptionIV: string;

  @IsString()
  @IsNotEmpty()
  encryptionAuthTag: string;
}
