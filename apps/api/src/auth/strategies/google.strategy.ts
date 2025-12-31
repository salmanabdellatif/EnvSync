import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const { id, displayName, emails, photos } = profile;

    const primaryEmail = emails?.[0]?.value;

    if (!primaryEmail) {
      throw new UnauthorizedException(
        'Google did not provide an email. Please ensure your Google account has a verified email address.',
      );
    }

    const userDetails = {
      email: primaryEmail,
      name: displayName || 'Google User',
      avatar: photos?.[0]?.value || null,
      provider: 'google',
      providerId: id,
    };

    const user = await this.authService.validateOAuthLogin(userDetails);

    return user;
  }
}
