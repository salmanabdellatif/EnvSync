import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { BackupDto } from './dto/user-keys.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────
  // Profile
  // ─────────────────────────────────────────────

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
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        publicKey: true,
      },
    });
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
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  async remove(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Account deleted successfully' };
  }

  // ─────────────────────────────────────────────
  // Public Key (E2E Encryption)
  // ─────────────────────────────────────────────

  async setPublicKey(userId: string, publicKey: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { publicKey },
    });
    return { message: 'Public key saved' };
  }

  async getPublicKey(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { publicKey: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return { publicKey: user.publicKey };
  }

  // ─────────────────────────────────────────────
  // Private Key Backup (Encrypted)
  // ─────────────────────────────────────────────

  async saveBackup(userId: string, dto: BackupDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        encryptedPrivateKey: dto.encryptedPrivateKey,
        encryptionIV: dto.iv,
        encryptionSalt: dto.salt,
        encryptionAuthTag: dto.authTag,
      },
    });
    return { message: 'Backup saved' };
  }

  async getBackup(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        encryptedPrivateKey: true,
        encryptionIV: true,
        encryptionSalt: true,
        encryptionAuthTag: true,
      },
    });

    if (!user?.encryptedPrivateKey) {
      throw new NotFoundException('No backup found');
    }

    return {
      encryptedPrivateKey: user.encryptedPrivateKey,
      iv: user.encryptionIV,
      salt: user.encryptionSalt,
      authTag: user.encryptionAuthTag,
    };
  }
}
