import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  Request,
  ConflictException,
  NotFoundException,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SetupKeysDto } from './dto/setup-keys.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('lookup')
  async lookup(@Query('email') email: string, @Request() req) {
    if (!email) {
      throw new BadRequestException('Email query parameter is required');
    }

    if (email === req.user.email) {
      throw new BadRequestException('Use /users/me for your own profile');
    }

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @Get('me')
  async getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Get('backup-keys')
  async getBackupKeys(@Request() req) {
    return this.usersService.getEncryptedBackup(req.user.id);
  }

  @Patch('me')
  async update(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Post('setup-keys')
  async setupKeys(@Request() req, @Body() dto: SetupKeysDto) {
    // 1. Fetch fresh user to be 100% sure
    const user = await this.usersService.findOne(req.user.id);

    // 2. Security Check
    if (user.publicKey) {
      throw new ConflictException('Encryption keys are already set up.');
    }

    return this.usersService.updateKeys(req.user.id, dto);
  }

  @Throttle({ default: { limit: 1, ttl: 60000 } })
  @Delete('me')
  async remove(@Request() req) {
    return this.usersService.remove(req.user.id);
  }
}
