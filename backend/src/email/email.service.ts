import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

export interface EmailUser {
  email: string;
  name: string;
  id?: string;
}

export interface FormSubmissionEmailData {
  formTitle: string;
  formId: string;
  submissionId: string;
  submittedBy?: string;
  submissionData: Record<string, any>;
  submissionDate: Date;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isDev = process.env.NODE_ENV !== 'production';
  private readonly appName = process.env.APP_NAME || 'Datizmo';
  private readonly frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  private readonly emailProvider = process.env.EMAIL_PROVIDER || 'smtp';
  private readonly fromEmail = process.env.MAIL_FROM || 'noreply@datizmo.com';
  private sesClient: SESClient | null = null;

  constructor(private mailerService: MailerService) {
    // Initialize AWS SES if configured
    if (this.emailProvider === 'aws-ses') {
      this.initializeAWSSES();
    }
  }

  private initializeAWSSES(): void {
    try {
      this.sesClient = new SESClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      this.logger.log('AWS SES client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize AWS SES client:', error);
      this.sesClient = null;
    }
  }

  private async sendEmailViaSES(to: string, subject: string, htmlContent: string): Promise<void> {
    if (!this.sesClient) {
      throw new Error('AWS SES client not initialized');
    }

    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlContent,
            Charset: 'UTF-8',
          },
        },
      },
    });

    await this.sesClient.send(command);
    this.logger.log(`Email sent via AWS SES to ${to}`);
  }

  private async renderTemplate(templateName: string, context: Record<string, any>): Promise<string> {
    const templatePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
    
    // Check if template exists in dist folder first, then src folder
    let finalTemplatePath = templatePath;
    if (!fs.existsSync(templatePath)) {
      const srcTemplatePath = path.join(process.cwd(), 'src', 'email', 'templates', `${templateName}.hbs`);
      if (fs.existsSync(srcTemplatePath)) {
        finalTemplatePath = srcTemplatePath;
      } else {
        throw new Error(`Template ${templateName} not found at ${templatePath} or ${srcTemplatePath}`);
      }
    }

    const templateContent = fs.readFileSync(finalTemplatePath, 'utf-8');
    const template = handlebars.compile(templateContent);
    return template(context);
  }

  private async sendEmail(to: string, subject: string, templateName: string, context: Record<string, any>): Promise<void> {
    if (this.isDev) {
      this.logEmailInDevelopment(to, subject, context);
      return;
    }

    if (this.emailProvider === 'aws-ses' && this.sesClient) {
      const htmlContent = await this.renderTemplate(templateName, context);
      await this.sendEmailViaSES(to, subject, htmlContent);
    } else {
      // Fallback to SMTP via MailerService
      await this.mailerService.sendMail({
        to,
        subject,
        template: `./${templateName}`,
        context,
      });
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(user: EmailUser): Promise<void> {
    const subject = `Welcome to ${this.appName}!`;
    
    await this.sendEmail(user.email, subject, 'welcome', {
      name: user.name,
      appName: this.appName,
      loginUrl: `${this.frontendUrl}/login`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@datizmo.com',
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string, name: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    const subject = `Reset Your ${this.appName} Password`;
    
    await this.sendEmail(email, subject, 'password-reset', {
      name,
      appName: this.appName,
      resetUrl,
      expiresIn: '24 hours',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@datizmo.com',
    });
  }

  /**
   * Send form submission notification to form owner
   */
  async sendFormSubmissionNotification(
    formOwner: EmailUser,
    submissionData: FormSubmissionEmailData
  ): Promise<void> {
    const subject = `New submission for "${submissionData.formTitle}"`;
    
    await this.sendEmail(formOwner.email, subject, 'form-submission', {
      ownerName: formOwner.name,
      appName: this.appName,
      formTitle: submissionData.formTitle,
      submissionId: submissionData.submissionId,
      submittedBy: submissionData.submittedBy || 'Anonymous',
      submissionDate: submissionData.submissionDate.toLocaleDateString(),
      submissionTime: submissionData.submissionDate.toLocaleTimeString(),
      viewSubmissionUrl: `${this.frontendUrl}/submissions/${submissionData.submissionId}`,
      formUrl: `${this.frontendUrl}/forms/${submissionData.formId}`,
      submissionData: submissionData.submissionData,
    });
  }

  /**
   * Send admin notification for important events
   */
  async sendAdminNotification(
    subject: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      this.logger.warn('ADMIN_EMAIL not configured, skipping admin notification');
      return;
    }

    await this.sendEmail(adminEmail, `[${this.appName} Admin] ${subject}`, 'admin-notification', {
      appName: this.appName,
      subject,
      message,
      data,
      timestamp: new Date().toLocaleString(),
      dashboardUrl: `${this.frontendUrl}/admin`,
    });
  }

  /**
   * Send email verification email for new registrations
   */
  async sendEmailVerification(user: EmailUser, token: string): Promise<void> {
    const verifyUrl = `${this.frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
    const subject = `Verify your ${this.appName} account`;
    
    await this.sendEmail(user.email, subject, 'email-verification', {
      name: user.name,
      appName: this.appName,
      verifyUrl,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@datizmo.com',
    });
  }

  /**
   * Send custom email using a template
   */
  async sendCustomEmail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>
  ): Promise<void> {
    await this.sendEmail(to, subject, template, {
      appName: this.appName,
      frontendUrl: this.frontendUrl,
      ...context,
    });
  }

  /**
   * Log email details in development mode instead of sending
   */
  private logEmailInDevelopment(to: string, subject: string, context: any): void {
    this.logger.log('='.repeat(50));
    this.logger.log('📧 EMAIL WOULD BE SENT (Development Mode)');
    this.logger.log('='.repeat(50));
    this.logger.log(`To: ${to}`);
    this.logger.log(`Subject: ${subject}`);
    this.logger.log(`Provider: ${this.emailProvider}`);
    this.logger.log('Context:', JSON.stringify(context, null, 2));
    this.logger.log('='.repeat(50));
  }
} 