import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    console.log('VERIFICATION EMAIL');
    console.log('To: ', email);
    console.log('Token: ', token);
    console.log('-------------------');
  }
}
