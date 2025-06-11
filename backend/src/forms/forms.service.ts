import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { UpdateFormEmailPreferencesDto } from './dto/update-form-email-preferences.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormFieldDto } from './dto/create-form-field.dto';
import { UpdateFormFieldDto } from './dto/update-form-field.dto';
import { Role, Form, WebhookEventType } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { WebhookDeliveryService } from '../webhooks/webhook-delivery.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class FormsService {
  private readonly logger = new Logger(FormsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookDeliveryService: WebhookDeliveryService,
    private readonly emailService: EmailService,
  ) {}

  async create(userId: string, createFormDto: CreateFormDto) {
    // Generate a slug if not provided
    const slug = await this.generateSlug(createFormDto.title, userId);
    
    // Process expirationDate if it's provided as string
    let formData: any = { ...createFormDto, slug, clientId: userId };
    
    if (createFormDto.expirationDate !== undefined) {
      try {
        // If it's a non-empty string, convert to a Date object
        if (createFormDto.expirationDate) {
          const date = new Date(createFormDto.expirationDate);
          
          // Validate that the date is valid
          if (isNaN(date.getTime())) {
            throw new BadRequestException('Invalid expiration date format');
          }
          
          formData.expirationDate = date;
        } else {
          // If empty string or null, set to null to clear the date
          formData.expirationDate = null;
        }
      } catch (error) {
        this.logger.error(`Error processing expiration date: ${error.message}`, error.stack);
        throw new BadRequestException('Invalid expiration date format');
      }
    }
    
    return this.prisma.form.create({
      data: formData,
      include: {
        fields: true,
      },
    });
  }

  async findAll(userId: string, userRole: Role) {
    // Super admin can see all forms
    if (userRole === Role.SUPER_ADMIN) {
      return this.prisma.form.findMany({
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              submissions: true,
              fields: true,
            },
          },
        },
      });
    }
    
    // Clients can only see their own forms
    return this.prisma.form.findMany({
      where: {
        clientId: userId,
      },
      include: {
        _count: {
          select: {
            submissions: true,
            fields: true,
          },
        },
      },
    });
  }
  async findOne(id: string, userId: string, userRole: Role) {
    const form = await this.prisma.form.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: {
            order: 'asc',
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!form) {
      throw new NotFoundException(`Form with ID ${id} not found`);
    }
    
    // Check permissions
    if (userRole !== Role.SUPER_ADMIN && form.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to access this form');
    }
    
    return form;
  }

  async findBySlug(clientId: string, slug: string) {
    const form = await this.prisma.form.findFirst({
      where: {
        clientId,
        slug,
        published: true,
      },
      include: {
        fields: {
          orderBy: {
            order: 'asc',
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!form) {
      throw new NotFoundException('Form not found');
    }
    
    return form;
  }

  // New method to find a form by slug only without requiring clientId
  async findBySlugOnly(slug: string) {
    this.logger.debug(`Finding form by slug: ${slug}`);
    
    // Extract the userId prefix from the slug (if it exists in our new format)
    // Format: base-slug-userIdPrefix-timestamp
    let slugParts = slug.split('-');
    let clientIdPrefix = null;
    
    // If slug has our expected format with at least 3 parts and the 3rd from last part might be a userId prefix
    if (slugParts.length >= 3) {
      // The userId prefix should be the third from last segment in the new format
      const potentialIdIndex = slugParts.length - 3;
      const potentialId = slugParts[potentialIdIndex];
      
      // If it looks like a userId prefix (8 chars, alphanumeric)
      if (potentialId && potentialId.length === 8 && /^[a-zA-Z0-9]+$/.test(potentialId)) {
        clientIdPrefix = potentialId;
      }
    }
    
    // First try to find by exact slug
    const form = await this.prisma.form.findFirst({
      where: {
        slug,
        published: true,
      },
      include: {
        fields: {
          orderBy: {
            order: 'asc',
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (form) {
      this.logger.debug(`Found form with slug ${slug}, access restriction: ${form.accessRestriction}, allowed emails: ${form.allowedEmails?.join(', ')}`);
      return form;
    }
    
    // If not found and we've identified a client prefix, try to find forms from that client
    if (clientIdPrefix) {
      const clientForms = await this.prisma.form.findMany({
        where: {
          clientId: {
            startsWith: clientIdPrefix
          },
          published: true,
        },
        include: {
          fields: {
            orderBy: {
              order: 'asc',
            },
          },
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      
      // If we find forms from this client, suggest them (return the first published one)
      if (clientForms.length > 0) {
        const publishedForms = clientForms.filter(f => f.published);
        if (publishedForms.length > 0) {
          this.logger.debug(`Found form by client prefix ${clientIdPrefix}, access restriction: ${publishedForms[0].accessRestriction}, allowed emails: ${publishedForms[0].allowedEmails?.join(', ')}`);
          return publishedForms[0];
        }
      }
    }
    
    throw new NotFoundException('Form not found. The form may have been removed or is no longer available.');
  }

  async update(id: string, userId: string, userRole: Role, updateFormDto: UpdateFormDto) {
    // Check if form exists and user has permission
    const existingForm = await this.findOne(id, userId, userRole);
    
    // Check if the published status is being changed
    const isPublishedChanged = 
      updateFormDto.published !== undefined && 
      updateFormDto.published !== existingForm.published;
    
    // Process expirationDate if it's provided as string
    let formData: any = { ...updateFormDto };
    
    if (updateFormDto.expirationDate !== undefined) {
      try {
        // If it's a non-empty string, convert to a Date object
        if (updateFormDto.expirationDate) {
          const date = new Date(updateFormDto.expirationDate);
          
          // Validate that the date is valid
          if (isNaN(date.getTime())) {
            throw new BadRequestException('Invalid expiration date format');
          }
          
          formData.expirationDate = date;
        } else {
          // If empty string or null, set to null to clear the date
          formData.expirationDate = null;
        }
      } catch (error) {
        this.logger.error(`Error processing expiration date: ${error.message}`, error.stack);
        throw new BadRequestException('Invalid expiration date format');
      }
    }
    
    // Update the form
    const updatedForm = await this.prisma.form.update({
      where: { id },
      data: formData,
      include: {
        fields: true,
      },
    });
    
    // Trigger webhooks if publishing status changed
    if (isPublishedChanged) {
      const eventType = updateFormDto.published 
        ? WebhookEventType.FORM_PUBLISHED 
        : WebhookEventType.FORM_UNPUBLISHED;
      
      this.logger.log(`Form ${id} ${updateFormDto.published ? 'published' : 'unpublished'} - triggering webhooks`);
      this.triggerFormWebhooks(id, eventType);
    }
    
    return updatedForm;
  }

  async updateFields(
    id: string,
    userId: string,
    userRole: string,
    fields: any[]
  ): Promise<Form> {
    const form = await this.prisma.form.findUnique({
      where: { id },
      include: { 
        fields: true,
        client: true,
      },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID ${id} not found`);
    }

    // Check permissions
    if (userRole !== 'ADMIN' && form.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to update this form');
    }

    // Use a transaction to ensure all operations succeed or fail together
    return this.prisma.$transaction(async (prisma) => {
      // First, delete all existing fields to avoid conflicts
      await prisma.formField.deleteMany({
        where: { formId: id },
      });
      
      // Then create all fields with their new order values
      const createdFields = await Promise.all(
        fields.map(async (field) => {
          // Prepare data for create operation
          const fieldData = {
            formId: id,
            type: field.type,
            label: field.label || '',
            placeholder: field.placeholder || null,
            required: field.required || false,
            options: field.options || [],
            config: field.config ? (typeof field.config === 'string' ? field.config : JSON.stringify(field.config)) : null,
            order: field.order,
            page: field.page || 1,
            conditions: field.conditions || null
          };
          
          return prisma.formField.create({
            data: fieldData
          });
        })
      );

      // Finally, return the updated form with new fields
      return prisma.form.findUnique({
        where: { id },
        include: {
          fields: {
            orderBy: { order: 'asc' },
          },
          client: true,
        },
      });
    });
  }

  async remove(id: string, userId: string, userRole: Role) {
    // Check if form exists and user has permission
    await this.findOne(id, userId, userRole);
    
    // Use a transaction to ensure all operations succeed or fail together
    return this.prisma.$transaction(async (prisma) => {
      // First, delete all submissions associated with the form
      await prisma.submission.deleteMany({
        where: { formId: id },
      });
      
      // Then delete the form (form fields will be deleted automatically due to onDelete: Cascade)
      await prisma.form.delete({ where: { id } });
      
      return { id };
    });
  }

  async addField(
    formId: string,
    userId: string,
    userRole: Role,
    createFormFieldDto: CreateFormFieldDto
  ) {
    await this.findOne(formId, userId, userRole);
  
    // Extract fields from DTO to avoid mixing formId with form relation
    const {
      type,
      label,
      placeholder,
      required,
      options,
      order,
      page,
      config,
      conditions
    } = createFormFieldDto;

    return this.prisma.formField.create({
      data: {
        formId,
        type,
        label,
        placeholder,
        required,
        options,
        order,
        page,
        config,
        conditions
      },
    });
  }
  
  async updateField(
    formId: string,
    fieldId: string,
    userId: string,
    userRole: Role,
    updateFormFieldDto: UpdateFormFieldDto
  ) {
    await this.findOne(formId, userId, userRole);
  
    const field = await this.prisma.formField.findUnique({ where: { id: fieldId } });
    if (!field || field.formId !== formId) {
      throw new NotFoundException(`Field ${fieldId} not found in form ${formId}`);
    }
  
    return this.prisma.formField.update({
      where: { id: fieldId },
      data: {
        ...updateFormFieldDto,
        // this will merge in any new config keys or overwrite existing
      },
    });
  }

  async removeField(formId: string, fieldId: string, userId: string, userRole: Role) {
    // Check if form exists and user has permission
    await this.findOne(formId, userId, userRole);
    
    // Check if field exists
    const field = await this.prisma.formField.findUnique({
      where: { id: fieldId },
    });
    
    if (!field || field.formId !== formId) {
      throw new NotFoundException(`Field with ID ${fieldId} not found in form ${formId}`);
    }
    
    await this.prisma.formField.delete({ where: { id: fieldId } });
    return { id: fieldId };
  }

  private async generateSlug(title: string, userId: string): Promise<string> {
    // Base slug from title
    const baseSlug = title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')  // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .trim()
      .slice(0, 40);            // Limit length (shorter to allow room for unique identifiers)
    
    // Add userId prefix (first 8 chars) for company uniqueness
    const companyPrefix = userId.slice(0, 8);
    
    // Add timestamp for uniqueness within the same company
    const timestamp = Date.now().toString().slice(-6);
    
    // Create the initial slug
    const initialSlug = `${baseSlug}-${companyPrefix}-${timestamp}`;
    
    // Check if a form with this slug already exists
    const existingForm = await this.prisma.form.findUnique({
      where: { slug: initialSlug },
    });
    
    // If slug already exists, add a random suffix (rare edge case)
    if (existingForm) {
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `${initialSlug}-${randomSuffix}`;
    }
    
    return initialSlug;
  }

  // Method to duplicate an existing form
  async duplicate(id: string, userId: string, role: Role) {
    const form = await this.findOne(id, userId, role);
    
    // Create a new title and slug
    const newTitle = `${form.title} (Copy)`;
    const newSlug = await this.generateUniqueSlug(form.slug);
    
    // Create a duplicate form first
    const newForm = await this.prisma.form.create({
      data: {
        title: newTitle,
        slug: newSlug,
        description: form.description,
        published: false, // Start as unpublished
        clientId: form.client.id,
      },
      include: {
        fields: true,
      },
    });
    
    // Duplicate all the fields
    if (form.fields && form.fields.length > 0) {
      await this.prisma.formField.createMany({
        data: form.fields.map(field => ({
          formId: newForm.id,
          type: field.type,
          label: field.label,
          placeholder: field.placeholder,
          required: field.required,
          options: field.options,
          order: field.order,
          config: field.config,
        })),
      });
    }
    
    // Return the new form with fields
    return this.findOne(newForm.id, userId, role);
  }

  private async generateUniqueSlug(baseSlug: string) {
    let slug = `${baseSlug}-copy`;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const existingForm = await this.prisma.form.findFirst({
        where: { slug },
      });

      if (!existingForm) {
        isUnique = true;
      } else {
        counter++;
        slug = `${baseSlug}-copy-${counter}`;
      }
    }

    return slug;
  }

  async createSubmission(formId: string, submissionData: any) {
    // Validate the form exists and is published
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!form) {
      throw new NotFoundException(`Form with ID ${formId} not found`);
    }

    if (!form.published) {
      throw new BadRequestException(`This form is not published and cannot accept submissions`);
    }

    // Extract formData and other fields from the submission data
    const { 
      data, 
      // Extract these fields so they don't get passed to Prisma
      consentGiven, 
      accessPassword, 
      emailAccess, 
      // Analytics data
      ipAddress,
      userAgent,
      referrer,
      browser,
      device,
      location,
      timezone,
      // Any other fields would be caught here
      ...otherFields 
    } = submissionData;

    this.logger.debug(`Creating submission for form ${formId}`);
    this.logger.debug(`Email access: ${emailAccess}`);
    
    // Only include valid fields in the Prisma create operation
    const submission = await this.prisma.submission.create({
      data: {
        formId,
        data: {
          ...data,
          // Make sure we include emailAccess in the data field too for reference
          emailAccess: emailAccess || data.emailAccess
        },
        status: 'new',
        ipAddress,
        userAgent,
        referrer,
        browser,
        device,
        location,
        timezone
      },
    });

    // Send email notification to form owner
    try {
      // Extract submitter information from form data
      const submissionDataObj = submission.data as Record<string, any>;
      let submittedBy = 'Anonymous';
      
      // Try to find name and email information
      const nameFields = ['name', 'fullName', 'full_name', 'firstName', 'first_name'];
      const emailFields = ['email', 'emailAddress', 'email_address'];
      
      let submitterName = '';
      let submitterEmail = '';
      
      // Look for name fields
      for (const field of nameFields) {
        if (submissionDataObj[field] && typeof submissionDataObj[field] === 'string') {
          submitterName = submissionDataObj[field];
          break;
        }
      }
      
      // Look for email fields
      for (const field of emailFields) {
        if (submissionDataObj[field] && typeof submissionDataObj[field] === 'string') {
          submitterEmail = submissionDataObj[field];
          break;
        }
      }
      
      // If no specific fields found, look for any field containing an email pattern
      if (!submitterEmail) {
        for (const [key, value] of Object.entries(submissionDataObj)) {
          if (typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            submitterEmail = value;
            break;
          }
        }
      }
      
      // Build submittedBy string
      if (submitterName && submitterEmail) {
        submittedBy = `${submitterName} (${submitterEmail})`;
      } else if (submitterName) {
        submittedBy = submitterName;
      } else if (submitterEmail) {
        submittedBy = submitterEmail;
      } else {
        // If no name/email found, show the first non-empty field value
        for (const [key, value] of Object.entries(submissionDataObj)) {
          if (value && typeof value === 'string' && value.trim() && key !== 'emailAccess') {
            submittedBy = `${value} (via ${key})`;
            break;
          }
        }
      }

      await this.emailService.sendFormSubmissionNotification(
        {
          email: form.client.email,
          name: form.client.name,
          id: form.client.id,
        },
        {
          formTitle: form.title,
          formId: form.id,
          submissionId: submission.id,
          submittedBy: submittedBy,
          submissionData: submission.data as Record<string, any>,
          submissionDate: submission.createdAt,
          timezone: submission.timezone,
        }
      );
    } catch (error) {
      this.logger.error(`Failed to send form submission notification: ${error.message}`, error.stack);
      // Don't fail the submission if email fails
    }

    // Trigger webhooks for this submission
    try {
      this.logger.log(`Triggering webhooks for form ${formId}, submission ${submission.id}`);
      
      // Find all active webhooks for this form
      const webhooks = await this.prisma.webhook.findMany({
        where: {
          formId,
          active: true,
          adminApproved: true,
          eventTypes: {
            has: WebhookEventType.SUBMISSION_CREATED
          }
        },
        include: {
          form: true
        }
      });
      
      this.logger.log(`Found ${webhooks.length} webhooks to trigger`);
      
      // Queue a delivery for each webhook
      for (const webhook of webhooks) {
        await this.webhookDeliveryService.queueDelivery(
          webhook.id, 
          WebhookEventType.SUBMISSION_CREATED, 
          submission.id
        );
      }
    } catch (error) {
      this.logger.error(`Error triggering webhooks: ${error.message}`, error.stack);
      // Don't throw, just log the error to not disrupt the submission process
    }
    
    return submission;
  }

  // Helper method to trigger webhooks for form events
  private async triggerFormWebhooks(formId: string, eventType: WebhookEventType) {
    try {
      this.logger.log(`Triggering webhooks for form ${formId}, event ${eventType}`);
      
      // Find all active webhooks for this form that listen for this event type
      const webhooks = await this.prisma.webhook.findMany({
        where: {
          formId,
          active: true,
          adminApproved: true,
          eventTypes: {
            has: eventType
          }
        }
      });
      
      this.logger.log(`Found ${webhooks.length} webhooks to trigger for event ${eventType}`);
      
      const form = await this.prisma.form.findUnique({
        where: { id: formId },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      if (!form) {
        this.logger.error(`Form ${formId} not found when triggering webhooks`);
        return;
      }
      
      // For each webhook that should be triggered
      for (const webhook of webhooks) {
        try {
          // Create a payload for the form event
          const payload = {
            event: eventType,
            form: {
              id: form.id,
              title: form.title || 'Form',
              description: form.description,
              published: form.published,
              createdAt: form.createdAt,
              updatedAt: form.updatedAt
            },
            client: {
              id: form.client.id,
              name: form.client.name
            },
            timestamp: new Date().toISOString()
          };
          
          // Create a delivery record
          await this.prisma.webhookDelivery.create({
            data: {
              webhookId: webhook.id,
              eventType: eventType,
              status: 'PENDING',
              requestBody: payload,
              attemptCount: 0,
              nextAttempt: new Date() // Schedule for immediate delivery
            }
          });
          
          this.logger.log(`Webhook delivery queued for webhook ${webhook.id}, form ${formId}, event ${eventType}`);
        } catch (error) {
          this.logger.error(`Error creating webhook delivery: ${error.message}`, error.stack);
        }
      }
    } catch (error) {
      this.logger.error(`Error triggering form webhooks: ${error.message}`, error.stack);
    }
  }

  async getFormEmailPreferences(formId: string, userId: string, userRole: Role) {
    // Check if form exists and user has permission
    const form = await this.findOne(formId, userId, userRole);

    return {
      id: form.id,
      title: form.title,
      emailNotifications: form.emailNotifications,
      webhookNotificationsEnabled: form.webhookNotificationsEnabled,
      formAnalyticsReports: form.formAnalyticsReports,
      securityAlerts: form.securityAlerts,
    };
  }

  async updateFormEmailPreferences(
    formId: string,
    updateFormEmailPreferencesDto: UpdateFormEmailPreferencesDto,
    userId: string,
    userRole: Role
  ) {
    // Check if form exists and user has permission
    await this.findOne(formId, userId, userRole);

    // Update form email preferences
    const updatedForm = await this.prisma.form.update({
      where: { id: formId },
      data: updateFormEmailPreferencesDto,
      select: {
        id: true,
        title: true,
        emailNotifications: true,
        webhookNotificationsEnabled: true,
        formAnalyticsReports: true,
        securityAlerts: true,
      }
    });

    return updatedForm;
  }
}