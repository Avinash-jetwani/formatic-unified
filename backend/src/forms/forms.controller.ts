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
    Req
  } from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
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
  constructor(private readonly formsService: FormsService) {}

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
      // Extract IP address from the request
      let ipAddress = req.ip;
      
      // Handle forwarded IPs (common in production setups with proxies)
      if (typeof ipAddress === 'string' && ipAddress.includes(',')) {
        // If multiple IPs are present (from X-Forwarded-For), take the first one
        ipAddress = ipAddress.split(',')[0].trim();
      }
      
      // For local development, handle localhost properly
      if (ipAddress === '::1' || ipAddress === '127.0.0.1') {
        // For testing we could set a fake IP if desired
        // ipAddress = '8.8.8.8'; // Example test IP
      }
      
      // Add the IP to submission data
      submissionData.ipAddress = ipAddress || 'unknown';
      
      // Use a free IP geolocation service to get location data
      if (ipAddress && ipAddress !== '::1' && ipAddress !== '127.0.0.1') {
        try {
          // Use axios to fetch location data from ipinfo.io (free tier has limits)
          const response = await axios.get(`https://ipinfo.io/${ipAddress}/json`);
          const locationData = response.data;
          
          // Prepare location data
          submissionData.location = {
            country: locationData.country,
            region: locationData.region,
            city: locationData.city,
            postal: locationData.postal,
            loc: locationData.loc // latitude,longitude
          };
        } catch (error) {
          console.error('Error fetching location data:', error);
          submissionData.location = {};
        }
      } else {
        submissionData.location = {};
      }
      
      // Forward to the service
      return this.formsService.createSubmission(formId, submissionData);
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    }
  }
}