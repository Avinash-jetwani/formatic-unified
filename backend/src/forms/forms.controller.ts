import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Patch, 
    Param, 
    Delete, 
    UseGuards, 
    Request,
    Put,
    Inject,
    Req,
    ForbiddenException,
    BadRequestException
  } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormAccessService } from './form-access.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { UpdateFormEmailPreferencesDto } from './dto/update-form-email-preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateFormFieldDto } from './dto/create-form-field.dto';
import { UpdateFormFieldDto } from './dto/update-form-field.dto';
import { Request as ExpressRequest } from 'express';
import axios from 'axios';
  
@Controller('forms')
export class FormsController {
  constructor(
    private readonly formsService: FormsService,
    private readonly formAccessService: FormAccessService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() createFormDto: CreateFormDto) {
    return this.formsService.create(req.user.id, createFormDto);
  }

  @Post(':id/duplicate')
  @UseGuards(JwtAuthGuard)
  duplicate(@Param('id') id: string, @Request() req) {
    return this.formsService.duplicate(id, req.user.id, req.user.role);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req) {
    return this.formsService.findAll(req.user.id, req.user.role);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req) {
    return this.formsService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string, 
    @Request() req, 
    @Body() updateFormDto: UpdateFormDto
  ) {
    return this.formsService.update(id, req.user.id, req.user.role, updateFormDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.formsService.remove(id, req.user.id, req.user.role);
  }

  @Post(':id/fields')
  @UseGuards(JwtAuthGuard)
  addField(
    @Param('id') id: string, 
    @Request() req, 
    @Body() createFormFieldDto: CreateFormFieldDto
  ) {
    return this.formsService.addField(id, req.user.id, req.user.role, createFormFieldDto);
  }

  @Put(':id/fields')
  @UseGuards(JwtAuthGuard)
  updateFields(
    @Param('id') id: string,
    @Request() req,
    @Body() data: { fields: any[] }
  ) {
    return this.formsService.updateFields(
      id,
      req.user.id,
      req.user.role,
      data.fields
    );
  }

  @Patch(':id/fields/:fieldId')
  @UseGuards(JwtAuthGuard)
  updateField(
     @Param('id') id: string,
     @Param('fieldId') fieldId: string,
     @Request() req,
     @Body() updateFormFieldDto: UpdateFormFieldDto
   ) {
     return this.formsService.updateField(
       id,
       fieldId,
       req.user.id,
       req.user.role,
       updateFormFieldDto
     );
   }

  @Delete(':id/fields/:fieldId')
  @UseGuards(JwtAuthGuard)
  removeField(
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
    @Request() req
  ) {
    return this.formsService.removeField(id, fieldId, req.user.id, req.user.role);
  }

  @Get('public/:clientId/:slug')
  findPublicForm(@Param('clientId') clientId: string, @Param('slug') slug: string) {
    return this.formsService.findBySlug(clientId, slug);
  }

  @Get('public/:slug')
  findPublicFormBySlug(@Param('slug') slug: string) {
    return this.formsService.findBySlugOnly(slug);
  }

  @Post('public/:formId/submit')
  async submitPublicForm(
    @Param('formId') formId: string,
    @Body() submissionData: any,
    @Request() req
  ) {
    try {
      // Validate form access restrictions (password, email, etc.)
      await this.formAccessService.validateFormAccess(formId, submissionData);
      
      // Validate consent if required
      await this.formAccessService.validateConsent(formId, submissionData);
      
      // Add IP address from request if possible
      if (!submissionData.ipAddress && req.ip) {
        submissionData.ipAddress = req.ip;
      }
      
      // Attempt to get geo location from IP (simplified version)
      if (submissionData.ipAddress && !submissionData.location) {
        try {
          // You would use a geolocation service here
          // This is a placeholder for demonstration
          submissionData.location = 'Unknown';
        } catch (error) {
          console.error('Error determining location:', error);
        }
      }
      
      // Submit the form data
      const submission = await this.formsService.createSubmission(formId, submissionData);
      
      // Process email notifications if configured
      await this.formAccessService.processNotifications(formId, submission.id);
      
      return submission;
    } catch (error) {
      console.error('Error submitting form:', error);
      
      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error; // Re-throw access validation errors
      }
      
      throw new BadRequestException('Failed to submit form. Please try again later.');
    }
  }

  @Get(':id/email-preferences')
  @UseGuards(JwtAuthGuard)
  getFormEmailPreferences(@Param('id') id: string, @Request() req) {
    return this.formsService.getFormEmailPreferences(id, req.user.id, req.user.role);
  }

  @Patch(':id/email-preferences')
  @UseGuards(JwtAuthGuard)
  updateFormEmailPreferences(
    @Param('id') id: string,
    @Body() updateFormEmailPreferencesDto: UpdateFormEmailPreferencesDto,
    @Request() req
  ) {
    return this.formsService.updateFormEmailPreferences(id, updateFormEmailPreferencesDto, req.user.id, req.user.role);
  }
}