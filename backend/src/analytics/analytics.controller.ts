import { Controller, Get, Query, UseGuards, Request, Header, Res } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Response } from 'express';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('client-growth')
  @Roles(Role.SUPER_ADMIN)
  async getClientGrowth(
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const data = await this.analytics.getClientGrowth(start, end);
    return data;
  }

  @Get('form-quality')
  @Roles(Role.SUPER_ADMIN)
  async getFormQuality() {
    const data = await this.analytics.getFormQuality();
    return data;
  }

  @Get('form-completion-rates')
  async getFormCompletionRates(
    @Request() req,
    @Query('clientId') clientId?: string,
  ) {
    // Super admins can view any client's data, clients can only view their own
    if (req.user.role === Role.SUPER_ADMIN) {
      const data = await this.analytics.getFormCompletionRates(clientId);
      return data;
    } else {
      const data = await this.analytics.getFormCompletionRates(req.user.id);
      return data;
    }
  }

  @Get('submission-funnel')
  async getSubmissionFunnel(
    @Request() req,
    @Query('clientId') clientId: string,
  ) {
    // Super admins can view any client's data, clients can only view their own
    if (req.user.role === Role.SUPER_ADMIN || req.user.id === clientId) {
      const data = await this.analytics.getSubmissionFunnel(clientId);
      return data;
    } else {
      return { error: 'Unauthorized', status: 403 };
    }
  }

  @Get('top-performing-forms')
  async getTopPerformingForms(
    @Request() req,
    @Query('clientId') clientId: string,
  ) {
    // Super admins can view any client's data, clients can only view their own
    if (req.user.role === Role.SUPER_ADMIN || req.user.id === clientId) {
      const data = await this.analytics.getTopPerformingForms(clientId);
      return data;
    } else {
      return { error: 'Unauthorized', status: 403 };
    }
  }

  @Get('field-distribution')
  async getFieldDistribution(
    @Request() req,
    @Query('clientId') clientId?: string,
  ) {
    // Super admins can view all data or specific client data
    if (req.user.role === Role.SUPER_ADMIN) {
      const data = await this.analytics.getFieldDistribution(clientId);
      return data;
    } else {
      // Clients can only view their own data
      const data = await this.analytics.getFieldDistribution(req.user.id);
      return data;
    }
  }

  @Get('conversion-trends')
  async getConversionTrends(
    @Request() req,
    @Query('clientId') clientId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    // Super admins can view any client's data, clients can only view their own
    if (req.user.role === Role.SUPER_ADMIN || req.user.id === clientId) {
      const data = await this.analytics.getConversionTrends(clientId, start, end);
      return data;
    } else {
      return { error: 'Unauthorized', status: 403 };
    }
  }

  @Get('export')
  async exportDashboardData(
    @Request() req,
    @Query('role') role: string,
    @Query('userId') userId: string,
    @Query('start') start: string,
    @Query('end') end: string,
    @Res() res: Response,
  ) {
    // Super admins can export any data, clients can only export their own
    if (
      req.user.role === Role.SUPER_ADMIN ||
      (req.user.role === Role.CLIENT && req.user.id === userId)
    ) {
      const csvData = await this.analytics.exportDashboardData(role, userId, start, end);
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=dashboard-data.csv');
      
      // Send CSV data directly without JSON parsing
      return res.send(csvData);
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }
  }
  }