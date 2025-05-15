import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { WebhookResponseDto } from './dto/webhook-response.dto';
import { TestWebhookDto } from './dto/test-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('webhooks')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('forms/:formId/webhooks')
  @ApiOperation({ summary: 'Create a new webhook for a form' })
  @ApiParam({ name: 'formId', description: 'Form ID' })
  @ApiResponse({ status: 201, description: 'Created', type: WebhookResponseDto })
  create(
    @Param('formId') formId: string, 
    @Body() createWebhookDto: CreateWebhookDto,
    @Request() req: any
  ): Promise<WebhookResponseDto> {
    return this.webhooksService.create(formId, createWebhookDto, req.user.id, req.user.role);
  }

  @Get('forms/:formId/webhooks')
  @ApiOperation({ summary: 'Get all webhooks for a form' })
  @ApiParam({ name: 'formId', description: 'Form ID' })
  @ApiResponse({ status: 200, description: 'Success', type: [WebhookResponseDto] })
  findAll(
    @Param('formId') formId: string,
    @Request() req: any
  ): Promise<WebhookResponseDto[]> {
    return this.webhooksService.findAll(formId, req.user.id, req.user.role);
  }

  @Get('forms/:formId/webhooks/:id')
  @ApiOperation({ summary: 'Get a webhook by ID' })
  @ApiParam({ name: 'formId', description: 'Form ID' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Success', type: WebhookResponseDto })
  findOne(
    @Param('formId') formId: string,
    @Param('id') id: string,
    @Request() req: any
  ): Promise<WebhookResponseDto> {
    return this.webhooksService.findOne(id, req.user.id, req.user.role);
  }

  @Patch('forms/:formId/webhooks/:id')
  @ApiOperation({ summary: 'Update a webhook' })
  @ApiParam({ name: 'formId', description: 'Form ID' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Success', type: WebhookResponseDto })
  update(
    @Param('formId') formId: string,
    @Param('id') id: string, 
    @Body() updateWebhookDto: UpdateWebhookDto,
    @Request() req: any
  ): Promise<WebhookResponseDto> {
    return this.webhooksService.update(id, updateWebhookDto, req.user.id, req.user.role);
  }

  @Delete('forms/:formId/webhooks/:id')
  @ApiOperation({ summary: 'Delete a webhook' })
  @ApiParam({ name: 'formId', description: 'Form ID' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 204, description: 'No Content' })
  remove(
    @Param('formId') formId: string,
    @Param('id') id: string,
    @Request() req: any
  ): Promise<void> {
    return this.webhooksService.remove(id, req.user.id, req.user.role);
  }

  @Post('forms/:formId/webhooks/:id/test')
  @ApiOperation({ summary: 'Test a webhook by sending a sample payload' })
  @ApiParam({ name: 'formId', description: 'Form ID' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  test(
    @Param('formId') formId: string,
    @Param('id') id: string,
    @Body() testWebhookDto: TestWebhookDto,
    @Request() req: any
  ): Promise<any> {
    return this.webhooksService.testWebhook(id, testWebhookDto, req.user.id, req.user.role);
  }

  // Admin-only endpoints
  @Get('admin/webhooks')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all webhooks (admin only)' })
  @ApiResponse({ status: 200, description: 'Success', type: [WebhookResponseDto] })
  async findAllAdmin(@Request() req: any): Promise<WebhookResponseDto[]> {
    try {
      this.logger.log(`Admin ${req.user.id} is fetching all webhooks`);
      return await this.webhooksService.findAllForAdmin(req.user.id);
    } catch (error) {
      this.logger.error(`Error fetching all webhooks: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Patch('admin/webhooks/:id/approve')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve a webhook (admin only)' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Success', type: WebhookResponseDto })
  async approveWebhook(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<WebhookResponseDto> {
    try {
      this.logger.log(`Admin ${req.user.id} is approving webhook ${id}`);
      return await this.webhooksService.approveWebhook(id, true, req.user.id, req.user.role);
    } catch (error) {
      this.logger.error(`Error approving webhook ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  @Patch('admin/webhooks/:id/reject')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject a webhook (admin only)' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Success', type: WebhookResponseDto })
  async rejectWebhook(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<WebhookResponseDto> {
    try {
      this.logger.log(`Admin ${req.user.id} is rejecting webhook ${id}`);
      return await this.webhooksService.approveWebhook(id, false, req.user.id, req.user.role);
    } catch (error) {
      this.logger.error(`Error rejecting webhook ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  @Get('admin/webhooks/pending')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all webhooks pending approval (admin only)' })
  @ApiResponse({ status: 200, description: 'Success', type: [WebhookResponseDto] })
  async findAllPending(@Request() req: any): Promise<WebhookResponseDto[]> {
    try {
      this.logger.log(`Admin ${req.user.id} is fetching pending webhooks`);
      return await this.webhooksService.findAllPending(req.user.id);
    } catch (error) {
      this.logger.error(`Error fetching pending webhooks: ${error.message}`, error.stack);
      throw error;
    }
  }
} 