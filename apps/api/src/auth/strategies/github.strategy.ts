import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GITHUB_ID'),
      clientSecret: configService.getOrThrow<string>('GITHUB_SECRET'),
      callbackURL: configService.getOrThrow<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const { id, displayName, username, emails, photos } = profile;

    const userDetails = {
      email: emails?.[0]?.value || '',
      name: displayName || username || 'GitHub User',
      avatar: photos?.[0]?.value || null,
      provider: 'github',
      providerId: id,
    };

    // This will create or update the user
    const user = await this.authService.validateOAuthLogin(userDetails);

    return user; // ✅ Direct return, no done()
  }
}
