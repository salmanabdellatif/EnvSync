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

export type AuthUser = Omit<User, 'password'>;

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

    // Send verification email
    await this.mailService.sendVerificationEmail(
      newUser.email,
      verificationToken,
    );

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

    if (!user || user.emailVerified) {
      return {
        message: 'If an account exists, a verification email has been sent.',
      };
    }

    const isTooFrequent =
      user.verifyTokenExp &&
      user.verifyTokenExp.getTime() > Date.now() + 23 * 60 * 60 * 1000; // Greater than 23 hours from now

    if (isTooFrequent) {
      throw new BadRequestException(
        'Please wait a while before requesting another email.',
      );
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

    await this.mailService.sendVerificationEmail(email, verificationToken);

    return {
      message: 'If an account exists, a verification email has been sent.',
    };
  }
}
