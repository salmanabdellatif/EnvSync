import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { render } from '@react-email/render';

import VerifyEmail from './templates/verify-email';
import ResetPasswordEmail from './templates/reset-password';

@Injectable()
export class MailService {
  private resend: Resend;
  private fromEmail: string;
  private appName: string;
  private frontendUrl: string;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    );
    this.fromEmail = this.configService.getOrThrow<string>('FROM_EMAIL');
    this.appName = this.configService.get<string>('APP_NAME', 'EnvSync');
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    // 1. Render the React Template to HTML
    const html = await render(VerifyEmail({ verifyUrl }));

    // 2. Send the email using Resend
    await this.resend.emails.send({
      from: `${this.appName} <${this.fromEmail}>`,
      to: email,
      subject: `Verify your ${this.appName} account`,
      html,
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

    // 1. Render the React Template to HTML
    const html = await render(ResetPasswordEmail({ resetUrl }));

    // 2. Send the email using Resend
    await this.resend.emails.send({
      from: `${this.appName} <${this.fromEmail}>`,
      to: email,
      subject: `Reset your ${this.appName} password`,
      html,
    });
  }
}
