import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isDev = process.env.NODE_ENV !== 'production';

  constructor(private mailerService: MailerService) {}

  async sendPasswordResetEmail(email: string, token: string, name: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    // In development, just log the email details
    if (this.isDev) {
      this.logger.log('==================== EMAIL ====================');
      this.logger.log(`To: ${email}`);
      this.logger.log('Subject: Reset Your Formatic Password');
      this.logger.log(`Reset URL: ${resetUrl}`);
      this.logger.log(`Token: ${token}`);
      this.logger.log('===============================================');
      return;
    }
    
    // In production, actually send the email
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset Your Formatic Password',
      template: './password-reset', // Using a handlebars template
      context: {
        name,
        resetUrl,
        expiresIn: '24 hours',
      },
    });
  }
} 