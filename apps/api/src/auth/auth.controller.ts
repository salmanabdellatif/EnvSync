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

  /**
   * Handles auth redirect for both CLI and Web flows
   * CLI: redirect to localhost with token
   * Web: set cookie and redirect to dashboard
   */
  private handleAuthRedirect(res: Response, token: string, state?: string) {
    // 1. CLI FLOW: Check for (State)
    if (state) {
      try {
        const decoded = JSON.parse(
          Buffer.from(state, 'base64').toString('utf-8'),
        );
        if (decoded.port) {
          // Redirect to localhost (CLI)
          const redirectUrl = `http://localhost:${decoded.port}/callback?token=${encodeURIComponent(token)}&state=${encodeURIComponent(decoded.secret || '')}`;
          return res.redirect(redirectUrl);
        }
      } catch (e) {}
    }

    // 2. WEB FLOW: Set Cookie & Redirect
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Number(this.configService.getOrThrow('AUTH_COOKIE_MAX_AGE')),
      domain:
        process.env.NODE_ENV === 'production' ? '.envsync.tech' : undefined,
    });

    return res.redirect(`${frontendUrl}/dashboard`);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @UseGuards(LocalAuthGuard) // if valid user -> returns the whole user in the req
  async login(
    @Body() loginDto: LoginDto,
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, access_token } = await this.authService.login(req.user);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Number(this.configService.getOrThrow('AUTH_COOKIE_MAX_AGE')),
      domain:
        process.env.NODE_ENV === 'production' ? '.envsync.tech' : undefined,
    });

    return { user, access_token };
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
  async githubCallback(
    @Req() req,
    @Res() res: Response,
    @Query('state') state: string,
  ) {
    const { access_token } = await this.authService.login(req.user);
    return this.handleAuthRedirect(res, access_token, state);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req,
    @Res() res: Response,
    @Query('state') state: string,
  ) {
    const { access_token } = await this.authService.login(req.user);
    return this.handleAuthRedirect(res, access_token, state);
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
