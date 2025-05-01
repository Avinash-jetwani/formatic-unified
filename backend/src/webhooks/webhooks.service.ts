import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { TestWebhookDto } from './dto/test-webhook.dto';
import { WebhookResponseDto } from './dto/webhook-response.dto';
import { Role, Webhook } from '@prisma/client';

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}

  async create(formId: string, createWebhookDto: CreateWebhookDto, userId: string, userRole: Role): Promise<WebhookResponseDto> {
    // Check if form exists and user has access
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID ${formId} not found`);
    }

    // Basic permission check (can be expanded)
    if (form.clientId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to add webhooks to this form');
    }

    const webhook = await this.prisma.webhook.create({
      data: {
        ...createWebhookDto,
        formId,
        createdById: userId,
      },
    });

    return this.toResponseDto(webhook);
  }

  async findAll(formId: string, userId: string, userRole: Role): Promise<WebhookResponseDto[]> {
    // Check if form exists and user has access
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID ${formId} not found`);
    }

    // Basic permission check (can be expanded)
    if (form.clientId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to view webhooks for this form');
    }

    const webhooks = await this.prisma.webhook.findMany({
      where: { formId },
    });

    return webhooks.map(webhook => this.toResponseDto(webhook));
  }

  async findOne(id: string, userId: string, userRole: Role): Promise<WebhookResponseDto> {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
      include: { form: true },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    // Basic permission check
    if (webhook.form.clientId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to view this webhook');
    }

    return this.toResponseDto(webhook);
  }

  async update(id: string, updateWebhookDto: UpdateWebhookDto, userId: string, userRole: Role): Promise<WebhookResponseDto> {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
      include: { form: true },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    // Basic permission check
    if (webhook.form.clientId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to update this webhook');
    }

    const updatedWebhook = await this.prisma.webhook.update({
      where: { id },
      data: updateWebhookDto,
    });

    return this.toResponseDto(updatedWebhook);
  }

  async remove(id: string, userId: string, userRole: Role): Promise<void> {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
      include: { form: true },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    // Basic permission check
    if (webhook.form.clientId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this webhook');
    }

    await this.prisma.webhook.delete({
      where: { id },
    });
  }

  async testWebhook(id: string, testDto: TestWebhookDto, userId: string, userRole: Role): Promise<any> {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
      include: { form: true },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    // Basic permission check
    if (webhook.form.clientId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to test this webhook');
    }

    // For now, just return success - in a real implementation we would call a service to send a test payload
    return { success: true, message: 'Test webhook request would be sent here' };
  }

  // Helper to convert database model to response DTO
  private toResponseDto(webhook: Webhook): WebhookResponseDto {
    // Exclude sensitive fields like secretKey
    const { secretKey, authValue, ...rest } = webhook as any;
    
    return {
      ...rest,
      secretKeySet: !!secretKey,
      authValueSet: !!authValue,
    };
  }
} 