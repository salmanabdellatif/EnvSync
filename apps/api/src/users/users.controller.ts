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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SetupKeysDto } from './dto/setup-keys.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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

  @Delete('me')
  async remove(@Request() req) {
    return this.usersService.remove(req.user.id);
  }
}
