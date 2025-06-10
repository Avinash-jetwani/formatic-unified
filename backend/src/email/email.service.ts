import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

// Force production mode for email sending - deployment trigger
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
  timezone?: string;
}

export interface WebhookEmailData {
  webhookName: string;
  webhookId: string;
  webhookUrl: string;
  formTitle: string;
  formId: string;
  createdAt: Date;
  eventTypes: string[];
}

export interface WebhookApprovalEmailData extends WebhookEmailData {
  approved: boolean;
  adminNotes?: string;
  adminName: string;
}

export interface WebhookTestEmailData extends WebhookEmailData {
  success: boolean;
  statusCode?: number;
  errorMessage?: string;
  responseData?: any;
  testDate: Date;
}

export interface WebhookFailureEmailData extends WebhookEmailData {
  submissionId: string;
  submittedBy: string;
  failureReason: string;
  attemptCount: number;
  maxRetries: number;
  failureDate: Date;
  nextRetryDate?: Date;
}

export interface WebhookPerformanceEmailData extends WebhookEmailData {
  period: string; // e.g., "Last 7 days"
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  averageResponseTime: number;
  recentFailures: Array<{
    date: Date;
    reason: string;
    submissionId: string;
  }>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  // Force production mode if we have SMTP credentials (indicating production server)
  private readonly isDev = process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST && !process.env.MAIL_HOST;
  private readonly appName = process.env.APP_NAME || 'Datizmo';
  private readonly frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  constructor(private mailerService: MailerService) {}

  private async sendEmail(to: string, subject: string, templateName: string, context: Record<string, any>): Promise<void> {
    this.logger.log(`📧 Email Service - NODE_ENV: ${process.env.NODE_ENV}, isDev: ${this.isDev}`);
    this.logger.log(`📧 Attempting to send email to: ${to}, subject: ${subject}, template: ${templateName}`);
    this.logger.log(`🔧 SMTP_HOST: ${process.env.SMTP_HOST ? 'configured' : 'not configured'}`);
    this.logger.log(`🔧 MAIL_HOST: ${process.env.MAIL_HOST ? 'configured' : 'not configured'}`);
    this.logger.log(`🔧 MAIL_USER: ${process.env.MAIL_USER ? 'configured' : 'not configured'}`);
    
    if (this.isDev) {
      this.logger.warn(`⚠️ Development mode detected - email will be logged instead of sent`);
      this.logEmailInDevelopment(to, subject, context);
      return;
    }

    this.logger.log(`🚀 Production mode - attempting to send via SMTP...`);
    this.logger.log(`📝 Template path: ./${templateName}`);
    this.logger.log(`📋 Context keys: ${Object.keys(context).join(', ')}`);
    
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template: `./${templateName}`,
        context,
      });
      this.logger.log(`✅ Email sent via SMTP to ${to} with template ${templateName}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${to} with template ${templateName}:`, error);
      this.logger.error(`❌ Error details:`, error.message);
      this.logger.error(`❌ Stack trace:`, error.stack);
      throw error;
    }
  }

  /**
   * Send welcome email to new users - Updated with modern templates
   */
  async sendWelcomeEmail(user: EmailUser): Promise<void> {
    const subject = `🎉 Welcome to ${this.appName} - Start Building Amazing Forms!`;
    
    await this.sendEmail(user.email, subject, 'welcome', {
      name: user.name,
      appName: this.appName,
      loginUrl: `${this.frontendUrl}/login`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
      // Modern template with features showcase - no support email line
    });
  }

  /**
   * Send password reset email - Updated with modern security design
   */
  async sendPasswordResetEmail(email: string, token: string, name: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    const subject = `🔐 Reset Your ${this.appName} Password`;
    
    await this.sendEmail(email, subject, 'password-reset', {
      name,
      appName: this.appName,
      resetUrl,
      expiresIn: '1 hour',
      // Modern security-focused template with best practices
    });
  }

  /**
   * Send form submission notification to form owner - Updated with celebration design
   */
  async sendFormSubmissionNotification(
    formOwner: EmailUser,
    submissionData: FormSubmissionEmailData
  ): Promise<void> {
    const subject = `🎉 New submission for "${submissionData.formTitle}"`;
    
    await this.sendEmail(formOwner.email, subject, 'form-submission', {
      ownerName: formOwner.name,
      appName: this.appName,
      formTitle: submissionData.formTitle,
      submissionId: submissionData.submissionId,
      submittedBy: submissionData.submittedBy || 'Anonymous',
      submissionDate: submissionData.submissionDate.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'numeric', 
        day: 'numeric',
        timeZone: submissionData.timezone || 'UTC'
      }),
      submissionTime: submissionData.submissionDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: submissionData.timezone || 'UTC'
      }),
      viewSubmissionUrl: `${this.frontendUrl}/dashboard/submissions/${submissionData.submissionId}`,
      formUrl: `${this.frontendUrl}/dashboard/forms/${submissionData.formId}`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
      submissionData: submissionData.submissionData,
    });
  }

  /**
   * Send webhook setup confirmation email
   */
  async sendWebhookSetupConfirmation(
    user: EmailUser,
    webhookData: WebhookEmailData
  ): Promise<void> {
    this.logger.log(`🔍 WEBHOOK EMAIL SERVICE DEBUG - Starting sendWebhookSetupConfirmation`);
    this.logger.log(`📧 Recipient: ${user.email}, Name: ${user.name}`);
    this.logger.log(`🔗 Webhook: ${webhookData.webhookName} (${webhookData.webhookId})`);
    this.logger.log(`📊 Environment: NODE_ENV=${process.env.NODE_ENV}, isDev=${this.isDev}`);
    this.logger.log(`📊 SMTP Config: MAIL_HOST=${process.env.MAIL_HOST ? 'configured' : 'not configured'}, MAIL_USER=${process.env.MAIL_USER ? 'configured' : 'not configured'}`);
    
    const subject = `🔗 Webhook "${webhookData.webhookName}" created and pending approval`;
    
    const emailContext = {
      userName: user.name,
      appName: this.appName,
      webhookName: webhookData.webhookName,
      webhookUrl: webhookData.webhookUrl,
      formTitle: webhookData.formTitle,
      eventTypes: webhookData.eventTypes.join(', '),
      createdDate: webhookData.createdAt.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }),
      webhookUrl_manage: `${this.frontendUrl}/dashboard/forms/${webhookData.formId}/webhooks`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    };
    
    this.logger.log(`📝 Email context: ${JSON.stringify(emailContext, null, 2)}`);
    this.logger.log(`🚀 Calling sendEmail with template: webhook-setup-confirmation`);
    
    try {
      await this.sendEmail(user.email, subject, 'webhook-setup-confirmation', emailContext);
      this.logger.log(`✅ sendWebhookSetupConfirmation completed successfully`);
    } catch (error) {
      this.logger.error(`❌ sendWebhookSetupConfirmation failed: ${error.message}`, error.stack);
      throw error; // Re-throw to ensure the error is properly handled by the calling service
    }
  }

  /**
   * Send webhook approval/rejection notification
   */
  async sendWebhookApprovalNotification(
    user: EmailUser,
    approvalData: WebhookApprovalEmailData
  ): Promise<void> {
    this.logger.log(`🔍 WEBHOOK APPROVAL EMAIL DEBUG - Starting sendWebhookApprovalNotification`);
    this.logger.log(`📧 Recipient: ${user.email}, Name: ${user.name}`);
    this.logger.log(`🔗 Webhook: ${approvalData.webhookName} (${approvalData.webhookId})`);
    this.logger.log(`✅ Approved: ${approvalData.approved}`);
    
    const subject = approvalData.approved 
      ? `✅ Webhook "${approvalData.webhookName}" approved and active`
      : `❌ Webhook "${approvalData.webhookName}" rejected`;
    
    const emailContext = {
      userName: user.name,
      appName: this.appName,
      webhookName: approvalData.webhookName,
      webhookUrl: approvalData.webhookUrl,
      formTitle: approvalData.formTitle,
      approved: approvalData.approved,
      adminName: approvalData.adminName,
      adminNotes: approvalData.adminNotes || (approvalData.approved ? 'Your webhook has been approved and is now active.' : 'Your webhook has been rejected.'),
      webhookUrl_manage: `${this.frontendUrl}/dashboard/forms/${approvalData.formId}/webhooks`,
      webhookUrl_logs: `${this.frontendUrl}/dashboard/forms/${approvalData.formId}/webhooks/${approvalData.webhookId}/logs`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    };
    
    this.logger.log(`📝 Email context: ${JSON.stringify(emailContext, null, 2)}`);
    
    try {
      await this.sendEmail(user.email, subject, 'webhook-approval', emailContext);
      this.logger.log(`✅ sendWebhookApprovalNotification completed successfully`);
    } catch (error) {
      this.logger.error(`❌ sendWebhookApprovalNotification failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send webhook test result notification
   */
  async sendWebhookTestNotification(
    user: EmailUser,
    testData: WebhookTestEmailData
  ): Promise<void> {
    this.logger.log(`🔍 WEBHOOK TEST EMAIL DEBUG - Starting sendWebhookTestNotification`);
    this.logger.log(`📧 Recipient: ${user.email}, Name: ${user.name}`);
    this.logger.log(`🔗 Webhook: ${testData.webhookName} (${testData.webhookId})`);
    this.logger.log(`✅ Test Success: ${testData.success}`);
    
    const subject = testData.success 
      ? `✅ Webhook test successful - "${testData.webhookName}"`
      : `❌ Webhook test failed - "${testData.webhookName}"`;
    
    const emailContext = {
      userName: user.name,
      appName: this.appName,
      webhookName: testData.webhookName,
      webhookUrl: testData.webhookUrl,
      formTitle: testData.formTitle,
      success: testData.success,
      statusCode: testData.statusCode,
      errorMessage: testData.errorMessage,
      responseData: testData.responseData ? JSON.stringify(testData.responseData, null, 2) : null,
      testDate: testData.testDate.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }),
      testTime: testData.testDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      webhookUrl_manage: `${this.frontendUrl}/dashboard/forms/${testData.formId}/webhooks`,
      webhookUrl_logs: `${this.frontendUrl}/dashboard/forms/${testData.formId}/webhooks/${testData.webhookId}/logs`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    };
    
    this.logger.log(`📝 Email context: ${JSON.stringify(emailContext, null, 2)}`);
    
    try {
      await this.sendEmail(user.email, subject, 'webhook-test-result', emailContext);
      this.logger.log(`✅ sendWebhookTestNotification completed successfully`);
    } catch (error) {
      this.logger.error(`❌ sendWebhookTestNotification failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send webhook delivery failure alert
   */
  async sendWebhookFailureAlert(
    user: EmailUser,
    failureData: WebhookFailureEmailData
  ): Promise<void> {
    this.logger.log(`🔍 WEBHOOK FAILURE EMAIL DEBUG - Starting sendWebhookFailureAlert`);
    this.logger.log(`📧 Recipient: ${user.email}, Name: ${user.name}`);
    this.logger.log(`🔗 Webhook: ${failureData.webhookName} (${failureData.webhookId})`);
    this.logger.log(`🚨 Failure: Attempt ${failureData.attemptCount}/${failureData.maxRetries}`);
    
    const isMaxRetriesReached = failureData.attemptCount >= failureData.maxRetries;
    const subject = isMaxRetriesReached
      ? `🚨 Webhook "${failureData.webhookName}" permanently failed`
      : `⚠️ Webhook "${failureData.webhookName}" delivery failed`;
    
    const emailContext = {
      userName: user.name,
      appName: this.appName,
      webhookName: failureData.webhookName,
      webhookUrl: failureData.webhookUrl,
      formTitle: failureData.formTitle,
      submissionId: failureData.submissionId,
      submittedBy: failureData.submittedBy,
      failureReason: failureData.failureReason,
      attemptCount: failureData.attemptCount,
      maxRetries: failureData.maxRetries,
      isMaxRetriesReached,
      failureDate: failureData.failureDate.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }),
      failureTime: failureData.failureDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      nextRetryDate: failureData.nextRetryDate ? failureData.nextRetryDate.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }) : null,
      nextRetryTime: failureData.nextRetryDate ? failureData.nextRetryDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) : null,
      webhookUrl_manage: `${this.frontendUrl}/dashboard/forms/${failureData.formId}/webhooks`,
      webhookUrl_logs: `${this.frontendUrl}/dashboard/forms/${failureData.formId}/webhooks/${failureData.webhookId}/logs`,
      submissionUrl: `${this.frontendUrl}/dashboard/submissions/${failureData.submissionId}`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    };
    
    this.logger.log(`📝 Email context: ${JSON.stringify(emailContext, null, 2)}`);
    
    try {
      await this.sendEmail(user.email, subject, 'webhook-failure-alert', emailContext);
      this.logger.log(`✅ sendWebhookFailureAlert completed successfully`);
    } catch (error) {
      this.logger.error(`❌ sendWebhookFailureAlert failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send webhook performance report
   */
  async sendWebhookPerformanceReport(
    user: EmailUser,
    performanceData: WebhookPerformanceEmailData
  ): Promise<void> {
    this.logger.log(`🔍 WEBHOOK PERFORMANCE EMAIL DEBUG - Starting sendWebhookPerformanceReport`);
    this.logger.log(`📧 Recipient: ${user.email}, Name: ${user.name}`);
    this.logger.log(`🔗 Webhook: ${performanceData.webhookName} (${performanceData.webhookId})`);
    this.logger.log(`📊 Performance: ${performanceData.successRate}% success rate`);
    
    const subject = `📊 Webhook Performance Report - "${performanceData.webhookName}" (${performanceData.period})`;
    
    const emailContext = {
      userName: user.name,
      appName: this.appName,
      webhookName: performanceData.webhookName,
      webhookUrl: performanceData.webhookUrl,
      formTitle: performanceData.formTitle,
      period: performanceData.period,
      totalDeliveries: performanceData.totalDeliveries,
      successfulDeliveries: performanceData.successfulDeliveries,
      failedDeliveries: performanceData.failedDeliveries,
      successRate: performanceData.successRate,
      averageResponseTime: performanceData.averageResponseTime,
      recentFailures: performanceData.recentFailures.map(failure => ({
        date: failure.date.toLocaleDateString('en-US', { 
          year: 'numeric',
          month: 'short', 
          day: 'numeric'
        }),
        reason: failure.reason,
        submissionId: failure.submissionId
      })),
      webhookUrl_manage: `${this.frontendUrl}/dashboard/forms/${performanceData.formId}/webhooks`,
      webhookUrl_logs: `${this.frontendUrl}/dashboard/forms/${performanceData.formId}/webhooks/${performanceData.webhookId}/logs`,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    };
    
    this.logger.log(`📝 Email context: ${JSON.stringify(emailContext, null, 2)}`);
    
    try {
      await this.sendEmail(user.email, subject, 'webhook-performance-report', emailContext);
      this.logger.log(`✅ sendWebhookPerformanceReport completed successfully`);
    } catch (error) {
      this.logger.error(`❌ sendWebhookPerformanceReport failed: ${error.message}`, error.stack);
      throw error;
    }
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
   * Send email verification email for new registrations - Updated with modern blue design
   */
  async sendEmailVerification(user: EmailUser, token: string): Promise<void> {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
    const subject = `✅ Verify Your ${this.appName} Email`;
    
    await this.sendEmail(user.email, subject, 'email-verification', {
      name: user.name,
      email: user.email,
      appName: this.appName,
      verificationUrl,
      // Modern blue-themed design with benefits and troubleshooting
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
    this.logger.log(`Provider: SMTP`);
    this.logger.log('Context:', JSON.stringify(context, null, 2));
    this.logger.log('='.repeat(50));
  }
} 