import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

// Used when uploading just the public key (first CLI login)
export class PublicKeyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  publicKey: string;
}

// Used when saving encrypted private key backup to server
export class BackupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  encryptedPrivateKey: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  iv: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  salt: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  authTag: string;
}
