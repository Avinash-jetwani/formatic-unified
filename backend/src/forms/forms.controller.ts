import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Patch, 
    Param, 
    Delete, 
    UseGuards, 
    Request
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
  
  @Controller('forms')
  export class FormsController {
    constructor(private readonly formsService: FormsService) {}
  
    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Request() req, @Body() createFormDto: CreateFormDto) {
      return this.formsService.create(req.user.id, createFormDto);
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
  }