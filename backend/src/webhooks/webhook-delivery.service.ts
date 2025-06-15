import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookDeliveryStatus, WebhookEventType } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Queue a webhook delivery for various events
   * @param webhookId The ID of the webhook to trigger
   * @param eventType The type of event (e.g., SUBMISSION_CREATED)
   * @param submissionId Optional ID of the submission for submission-related events
   */
  async queueDelivery(
    webhookId: string, 
    eventType: string,
    submissionId?: string
  ): Promise<void> {
    try {
      this.logger.log(`Queuing webhook delivery: webhook=${webhookId}, event=${eventType}${submissionId ? `, submission=${submissionId}` : ''}`);
      
      // Find the webhook
      const webhook = await this.prisma.webhook.findUnique({
        where: { id: webhookId },
        include: {
          form: {
            include: {
              fields: true
            }
          }
        }
      });
      
      if (!webhook || !webhook.active) {
        this.logger.debug(`Webhook ${webhookId} not found or inactive - skipping delivery`);
        return;
      }
      
      let payload: any = {
        event: eventType,
        timestamp: new Date().toISOString()
      };
      
      // Create different payloads based on event type
      if (eventType === WebhookEventType.SUBMISSION_CREATED || eventType === WebhookEventType.SUBMISSION_UPDATED) {
        if (!submissionId) {
          this.logger.error(`Missing submissionId for ${eventType} event`);
          return;
        }
        
        // For submission events, include submission data
        const submission = await this.prisma.submission.findUnique({
          where: { id: submissionId },
          include: { 
            form: {
              include: {
                fields: true
              }
            }
          }
        });
        
        if (!submission) {
          this.logger.debug(`Submission ${submissionId} not found - skipping delivery`);
          return;
        }
        
        // Transform field IDs to labels and then apply filters
        const transformedData = this.transformFieldIdsToLabels(submission.data, submission.form.fields);
        const filteredData = this.filterSubmissionData(transformedData, webhook, submission.form.fields);
        
        payload = {
          ...payload,
          form: {
            id: submission.form.id,
            title: submission.form.title || 'Form'
          },
          submission: {
            id: submission.id,
            createdAt: submission.createdAt,
            updatedAt: submission.updatedAt,
            status: submission.status,
            data: filteredData
          }
        };
      } 
      else if (eventType === WebhookEventType.FORM_PUBLISHED || eventType === WebhookEventType.FORM_UNPUBLISHED) {
        // For form events, include form data
        payload = {
          ...payload,
          form: {
            id: webhook.form.id,
            title: webhook.form.title || 'Form',
            description: webhook.form.description,
            published: webhook.form.published,
            createdAt: webhook.form.createdAt,
            updatedAt: webhook.form.updatedAt
          },
          client: {
            id: webhook.form.clientId
          }
        };
      }
      
      // Create a delivery record
      await this.prisma.webhookDelivery.create({
        data: {
          webhookId,
          submissionId,
          eventType: eventType as WebhookEventType,
          status: WebhookDeliveryStatus.PENDING,
          requestBody: payload,
          attemptCount: 0,
          nextAttempt: new Date() // Schedule for immediate delivery
        }
      });
      
      this.logger.log(`Webhook delivery queued for webhook ${webhookId}, event ${eventType}`);
    } catch (error) {
      this.logger.error(`Error queueing webhook delivery: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Transform field IDs to labels in submission data
   */
  private transformFieldIdsToLabels(data: any, formFields: any[]): any {
    if (!data || typeof data !== 'object') return {};
    
    const transformedData: any = {};
    
    Object.entries(data).forEach(([key, value]) => {
      // Try to find the field definition from the form fields
      const field = formFields.find(f => f.id === key);
      
      let label: string;
      if (field?.label) {
        // Use the real field label from the form definition
        label = field.label;
      } else {
        // Fallback to formatting the key if no field definition found
        if (key.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          // For UUID keys, use a generic label
          label = 'Response';
        } else {
          // For regular keys, format them nicely
          label = key
            .replace(/([A-Z])/g, ' $1') // Add space before capital letters
            .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
            .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
            .trim();
        }
      }
      
      transformedData[label] = value;
    });
    
    return transformedData;
  }
  
  /**
   * Filter submission data based on webhook include/exclude fields
   * Now works with field labels instead of field IDs
   */
  private filterSubmissionData(data: any, webhook: any, formFields: any[]): any {
    if (!data) return {};
    
    // Create a copy of the data
    const filteredData = { ...data };
    
    // Helper function to convert field ID to label (for backward compatibility with existing webhook configurations)
    const getFieldLabel = (fieldIdOrLabel: string): string => {
      // First check if it's already a label (direct match)
      if (filteredData[fieldIdOrLabel] !== undefined) {
        return fieldIdOrLabel;
      }
      
      // Otherwise, try to find the field by ID and return its label
      const field = formFields.find(f => f.id === fieldIdOrLabel);
      return field?.label || fieldIdOrLabel;
    };
    
    // Apply include fields filter
    if (webhook.includeFields && webhook.includeFields.length > 0) {
      const keysToKeep = webhook.includeFields.map(getFieldLabel);
      Object.keys(filteredData).forEach(key => {
        if (!keysToKeep.includes(key)) {
          delete filteredData[key];
        }
      });
    }
    
    // Apply exclude fields filter
    if (webhook.excludeFields && webhook.excludeFields.length > 0) {
      const keysToRemove = webhook.excludeFields.map(getFieldLabel);
      keysToRemove.forEach(key => {
        delete filteredData[key];
      });
    }
    
    return filteredData;
  }
} 