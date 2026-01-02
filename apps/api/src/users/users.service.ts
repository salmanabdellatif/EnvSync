import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { SetupKeysDto } from './dto/setup-keys.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        publicKey: true,
        emailVerified: true,
        createdAt: true,
        // Never return: password, encryptedPrivateKey, etc.
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    });
  }

  async getEncryptedBackup(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        // We need these to decrypt the Private Key locally
        encryptedPrivateKey: true,
        encryptionSalt: true,
        encryptionIV: true,
        encryptionAuthTag: true,
        // We also need the public key to check consistency
        publicKey: true,
      },
    });

    if (!user || !user.encryptedPrivateKey) {
      throw new NotFoundException('No encryption backup found for this user');
    }

    return user;
  }

  async updateKeys(userId: string, dto: SetupKeysDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        publicKey: dto.publicKey,
        encryptedPrivateKey: dto.encryptedPrivateKey,
        encryptionSalt: dto.encryptionSalt,
        encryptionIV: dto.encryptionIV,
        encryptionAuthTag: dto.encryptionAuthTag,
      },
    });

    return { message: 'Encryption keys set up successfully' };
  }

  async remove(userId: string) {
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Account deleted successfully' };
  }
}
