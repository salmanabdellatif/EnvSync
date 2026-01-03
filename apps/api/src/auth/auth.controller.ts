import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { Throttle } from '@nestjs/throttler';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @UseGuards(LocalAuthGuard) // if valid user -> returns the whole user in the req
  login(@Body() loginDto: LoginDto, @Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  profile(@Request() req) {
    return req.user;
  }

  @UseGuards(GithubAuthGuard)
  @Get('github')
  async githubLogin() {}

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubCallback(@Req() req, @Res() res: Response) {
    const { access_token } = await this.authService.login(req.user);
    // Redirect to Frontend with Token
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    res.redirect(`${frontendUrl}/dashboard?token=${access_token}`);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req, @Res() res: Response) {
    const { access_token } = await this.authService.login(req.user);
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    res.redirect(`${frontendUrl}/dashboard?token=${access_token}`);
  }

  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
