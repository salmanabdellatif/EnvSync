import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  Request,
  NotFoundException,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { PublicKeyDto, BackupDto } from './dto/user-keys.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─────────────────────────────────────────────
  // Profile
  // ─────────────────────────────────────────────

  @Get('me')
  async getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Patch('me')
  async updateProfile(@Request() req, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.id, dto);
  }

  @Throttle({ default: { limit: 1, ttl: 60000 } })
  @Delete('me')
  async deleteAccount(@Request() req) {
    return this.usersService.remove(req.user.id);
  }

  // ─────────────────────────────────────────────
  // User Lookup (for inviting members)
  // ─────────────────────────────────────────────

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('lookup')
  async lookup(@Query('email') email: string, @Request() req) {
    if (!email) {
      throw new BadRequestException('Email query parameter is required');
    }

    if (email === req.user.email) {
      throw new BadRequestException('Use /users/me for your own profile');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  // ─────────────────────────────────────────────
  // Public Key (E2E Encryption)
  // ─────────────────────────────────────────────

  @Post('key')
  async setPublicKey(@Request() req, @Body() dto: PublicKeyDto) {
    return this.usersService.setPublicKey(req.user.id, dto.publicKey);
  }

  @Get('key')
  async getPublicKey(@Request() req) {
    return this.usersService.getPublicKey(req.user.id);
  }

  // ─────────────────────────────────────────────
  // Private Key Backup (Encrypted)
  // ─────────────────────────────────────────────

  @Post('backup')
  async saveBackup(@Request() req, @Body() dto: BackupDto) {
    return this.usersService.saveBackup(req.user.id, dto);
  }

  @Get('backup')
  async getBackup(@Request() req) {
    return this.usersService.getBackup(req.user.id);
  }
}
