import { Injectable, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FormAccessService {
  private readonly logger = new Logger(FormAccessService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Validates if a form can be accessed and submitted based on its settings
   */
  async validateFormAccess(formId: string, payload: any) {
    // Get the full form without type restrictions
    const form = await this.prisma.form.findUnique({
      where: { id: formId }
    });

    if (!form) {
      throw new BadRequestException('Form not found');
    }

    if (!form.published) {
      throw new ForbiddenException('This form is not currently accepting submissions');
    }

    // Check for form expiration
    const expirationDate = form['expirationDate'];
    if (expirationDate && new Date(expirationDate) < new Date()) {
      throw new ForbiddenException('This form has expired and is no longer accepting submissions');
    }

    // Check for submission limits
    const maxSubmissions = form['maxSubmissions'];
    if (maxSubmissions && maxSubmissions > 0) {
      // Get the submission count separately
      const submissionCount = await this.prisma.submission.count({
        where: { formId }
      });
      
      if (submissionCount >= maxSubmissions) {
        throw new ForbiddenException('This form has reached its maximum number of submissions');
      }
    }

    // Check access restrictions
    const accessRestriction = form['accessRestriction'];
    this.logger.debug(`Form access restriction: ${accessRestriction}`);
    
    if (accessRestriction === 'password') {
      const providedPassword = payload.accessPassword;
      const formPassword = form['accessPassword'];
      
      if (!providedPassword) {
        throw new ForbiddenException('This form requires a password to submit');
      }
      
      if (providedPassword !== formPassword) {
        throw new ForbiddenException('Invalid password provided');
      }
    } 
    else if (accessRestriction === 'email') {
      // For email restriction, use the emailAccess field from the payload if it exists
      let emailValue = payload.emailAccess;
      this.logger.debug(`Email access value from payload: ${emailValue}`);
      
      // Also check in the form data which is where frontend might store it
      if (!emailValue && payload.data && payload.data.emailAccess) {
        emailValue = payload.data.emailAccess;
        this.logger.debug(`Found email in form data.emailAccess: ${emailValue}`);
      }
      
      // If no email was explicitly provided, try to find one in the submission data
      if (!emailValue && payload.data) {
        this.logger.debug('No explicit email provided, searching in form data fields');
        // Look for any field that contains a valid email
        for (const [fieldId, value] of Object.entries(payload.data)) {
          // Simple email check using regex
          if (typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            emailValue = value;
            this.logger.debug(`Found email in form data field ${fieldId}: ${emailValue}`);
            break;
          }
        }
      }
      
      if (!emailValue) {
        this.logger.error('No email found in submission');
        throw new ForbiddenException('This form requires a valid email address to submit');
      }
      
      // Check if the email is in the allowed list
      const allowedEmails = form['allowedEmails'] || [];
      this.logger.debug(`Allowed emails list: [${allowedEmails.join(', ')}]`);
      this.logger.debug(`Checking if email "${emailValue}" is in allowed list`);
      
      if (allowedEmails.length === 0) {
        this.logger.debug('No allowed emails configured, allowing all emails');
        // If no emails are explicitly allowed, assume all valid emails are allowed
        return true;
      }
      
      const isAllowed = allowedEmails.some(email => 
        email.toLowerCase() === emailValue.toLowerCase()
      );
      
      this.logger.debug(`Email "${emailValue}" allowed: ${isAllowed}`);
      
      if (!isAllowed) {
        this.logger.error(`Email "${emailValue}" not in allowed list: [${allowedEmails.join(', ')}]`);
        throw new ForbiddenException(`The email address "${emailValue}" is not authorized to submit this form. Please contact the form owner if you believe this is an error.`);
      }
    }

    return true;
  }

  /**
   * Process GDPR consent requirements
   */
  async validateConsent(formId: string, payload: any) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId }
    });

    if (!form) {
      throw new BadRequestException('Form not found');
    }

    // Check if the form requires consent and whether it was provided
    const requireConsent = form['requireConsent'];
    
    if (requireConsent) {
      // Make sure to handle different possible values of consentGiven
      // It could be a boolean true, string 'true', or any truthy value
      const consentGiven = payload.consentGiven === true || 
                          payload.consentGiven === 'true' || 
                          payload.consentGiven === 1;
                          
      if (!consentGiven) {
        throw new BadRequestException('You must give consent to submit this form');
      }
    }

    return true;
  }

  /**
   * Process email notifications for form submissions
   */
  async processNotifications(formId: string, submissionId: string) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId }
    });

    if (!form) {
      return;
    }

    const emailNotifications = form['emailNotifications'];
    const notificationEmails = form['notificationEmails'] || [];
    
    if (!emailNotifications || notificationEmails.length === 0) {
      return;
    }

    // For demonstration purposes, log the notification details
    // In a real implementation, you would integrate with an email service
    this.logger.log(`[Notification] Form submission received for "${form.title}"`);
    this.logger.log(`Recipients: ${notificationEmails.join(', ')}`);
    this.logger.log(`Notification type: ${form['notificationType']}`);
    this.logger.log(`Submission ID: ${submissionId}`);

    // In a real implementation, you would send emails here
    // For digest notifications, you would store the notification for processing later
    if (form['notificationType'] === 'digest') {
      // Store for later batch processing (simplified version)
      this.logger.log(`Scheduling digest notification for submission ${submissionId} with recipients: ${notificationEmails.join(', ')}`);
      // In a production implementation, you would store the notification for later processing
    } else {
      // Send immediately (simplified version)
      this.logger.log(`Sending immediate notification for submission ${submissionId} to ${notificationEmails.join(', ')}`);
      // In a production implementation, you would call your email service here
    }

    return true;
  }
} 