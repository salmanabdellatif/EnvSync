import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    console.log('VERIFICATION EMAIL');
    console.log('To: ', email);
    console.log('Token: ', token);
    console.log('-------------------');
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `http://localhost:3000/auth/reset-password?token=${token}`;
    console.log('Password Reset');
    console.log('To: ', email);
    console.log('Token: ', token);
    console.log('reset link: ', resetLink);
    console.log('-------------------');
  }
}
