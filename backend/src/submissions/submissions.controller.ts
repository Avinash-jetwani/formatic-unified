import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Param, 
    Delete, 
    UseGuards, 
    Request,
    Query 
  } from '@nestjs/common';
  import { SubmissionsService } from './submissions.service';
  import { CreateSubmissionDto } from './dto/create-submission.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { Role } from '@prisma/client';
  
  @Controller('submissions')
  export class SubmissionsController {
    constructor(private readonly submissionsService: SubmissionsService) {}
  
    @Post()
    create(@Body() createSubmissionDto: CreateSubmissionDto) {
      return this.submissionsService.create(createSubmissionDto);
    }
  
    @Get()
    @UseGuards(JwtAuthGuard)
    findAll(@Request() req) {
      return this.submissionsService.findAll(req.user.id, req.user.role);
    }
  
    @Get('form/:id')
    @UseGuards(JwtAuthGuard)
    findByForm(@Param('id') id: string, @Request() req) {
      return this.submissionsService.findByForm(id, req.user.id, req.user.role);
    }
  
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    findOne(@Param('id') id: string, @Request() req) {
      return this.submissionsService.findOne(id, req.user.id, req.user.role);
    }
  
    @Get(':id/siblings')
    @UseGuards(JwtAuthGuard)
    findSiblings(
      @Param('id') id: string, 
      @Query('formId') formId: string, 
      @Request() req
    ) {
      return this.submissionsService.findSiblings(id, formId, req.user.id, req.user.role);
    }
  
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string, @Request() req) {
      return this.submissionsService.remove(id, req.user.id, req.user.role);
    }
  }