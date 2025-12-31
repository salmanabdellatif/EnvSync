import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/generated/prisma/client';
import { RegisterDto } from './dto/register.dto';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

export type AuthUser = Omit<User, 'password'>;
interface OAuthUserDetails {
  email: string;
  name: string;
  avatar: string | null;
  provider: string;
  providerId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) throw new BadRequestException('Email already in use');
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Generate secure random token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = await this.prisma.user.create({
      data: {
        ...registerDto,
        password: hashedPassword,
        verifyToken: verificationToken,
        verifyTokenExp: tokenExpires,
      },
    });

    try {
      await this.mailService.sendVerificationEmail(
        newUser.email,
        verificationToken,
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // User is still registered, they can resend verification later
    }

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  async validateUser(email: string, password: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // check if user exist
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // check is email verified
    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    // password is null if user sign up using OAuth
    if (!user.password) {
      throw new UnauthorizedException('Please use OAuth to sign in');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // return user without password to the guard
    const { password: _, ...rest } = user;
    return rest;
  }

  async login(user: AuthUser) {
    const payload = { email: user.email, sub: user.id };

    return {
      user,
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateOAuthLogin(details: OAuthUserDetails) {
    // 1. Check if this specific OAuth provider is already linked
    const existingOAuth = await this.prisma.oAuthProvider.findUnique({
      where: {
        provider_providerId: {
          provider: details.provider,
          providerId: details.providerId,
        },
      },
      include: { user: true },
    });

    // return user if founded
    if (existingOAuth) {
      const { password: _, ...rest } = existingOAuth.user;
      return rest;
    }

    // 2. Check if email exists
    let user = await this.prisma.user.findUnique({
      where: { email: details.email },
    });

    if (user) {
      // User exists - link this new OAuth provider to existing account
      if (!user.emailVerified) {
        throw new BadRequestException(
          `Please verify your email before linking ${details.provider} account`,
        );
      }

      // Link the new OAuth provider
      await this.prisma.oAuthProvider.create({
        data: {
          provider: details.provider,
          providerId: details.providerId,
          userId: user.id,
        },
      });

      // Update avatar if not set
      if (!user.avatar && details.avatar) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { avatar: details.avatar },
        });
      }

      const { password: _, ...rest } = user;
      return rest;
    }

    // 3. Create new user with OAuth provider
    user = await this.prisma.user.create({
      data: {
        email: details.email,
        name: details.name,
        avatar: details.avatar,
        emailVerified: true,
        oauthProviders: {
          create: {
            provider: details.provider,
            providerId: details.providerId,
          },
        },
      },
    });

    const { password: _, ...rest } = user;
    return rest;
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { verifyToken: token },
    });
    // if token is correct
    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.emailVerified) {
      return { message: 'Email already verified.' };
    }

    if (user.verifyTokenExp && user.verifyTokenExp < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyToken: null,
        verifyTokenExp: null,
      },
    });

    return { message: 'Email verified successfully! You can now log in.' };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    const genericMessage = {
      message: 'If an account exists, a verification email has been sent.',
    };

    if (!user || user.emailVerified) {
      return genericMessage;
    }

    if (
      user.verifyTokenExp &&
      user.verifyTokenExp.getTime() > Date.now() + 23 * 60 * 60 * 1000
    ) {
      return genericMessage;
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verifyToken: verificationToken,
        verifyTokenExp: tokenExpires,
      },
    });

    try {
      await this.mailService.sendVerificationEmail(email, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }
    return genericMessage;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    const genericMessage = {
      message: 'If an account exists, a reset link has been sent.',
    };
    if (!user || !user.password) {
      return genericMessage;
    }

    // Anti-Spam, prevent users to resend reset token in less than 5 mins
    if (
      user.resetTokenExp &&
      user.resetTokenExp.getTime() > Date.now() + 55 * 60 * 1000
    ) {
      return genericMessage;
    }

    // Generate Token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000);

    // Save to DB
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExp,
      },
    });

    try {
      await this.mailService.sendPasswordResetEmail(dto.email, resetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }
    return genericMessage;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: dto.token,
        resetTokenExp: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    return { message: 'Password reset successfully. You can now login.' };
  }
}
