import { Controller, Get, Param, Query, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { WebhookLogsService } from './webhook-logs.service';
import { WebhookDeliveryStatus } from '@prisma/client';

@ApiTags('webhook-logs')
@Controller('webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WebhookLogsController {
  constructor(private readonly webhookLogsService: WebhookLogsService) {}

  @Get(':webhookId/logs')
  @ApiOperation({ summary: 'Get webhook delivery logs' })
  @ApiParam({ name: 'webhookId', description: 'Webhook ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, enum: WebhookDeliveryStatus, description: 'Filter by status' })
  async getLogs(
    @Param('webhookId') webhookId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: WebhookDeliveryStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.webhookLogsService.getDeliveryLogs(webhookId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get(':webhookId/logs/:logId')
  @ApiOperation({ summary: 'Get webhook delivery log details' })
  @ApiParam({ name: 'webhookId', description: 'Webhook ID' })
  @ApiParam({ name: 'logId', description: 'Log ID' })
  async getLog(
    @Param('webhookId') webhookId: string,
    @Param('logId') logId: string,
  ) {
    return this.webhookLogsService.getDeliveryLog(logId);
  }

  @Post(':webhookId/logs/:logId/retry')
  @ApiOperation({ summary: 'Retry a failed webhook delivery' })
  @ApiParam({ name: 'webhookId', description: 'Webhook ID' })
  @ApiParam({ name: 'logId', description: 'Log ID' })
  async retryDelivery(
    @Param('webhookId') webhookId: string,
    @Param('logId') logId: string,
  ) {
    return this.webhookLogsService.retryDelivery(logId);
  }

  @Get(':webhookId/stats')
  @ApiOperation({ summary: 'Get webhook delivery statistics' })
  @ApiParam({ name: 'webhookId', description: 'Webhook ID' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days for stats' })
  async getStats(
    @Param('webhookId') webhookId: string,
    @Query('days') days: string = '7',
  ) {
    return this.webhookLogsService.getDeliveryStats(webhookId, parseInt(days, 10));
  }
} 