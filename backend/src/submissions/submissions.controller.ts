import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Param, 
    Delete, 
    UseGuards, 
    Request,
    Query,
    Res,
    NotFoundException,
    ForbiddenException,
    InternalServerErrorException,
    Patch
  } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Response } from 'express';

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

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string, 
    @Body() updateSubmissionDto: UpdateSubmissionDto,
    @Request() req
  ) {
    return this.submissionsService.update(id, updateSubmissionDto, req.user.id, req.user.role);
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

  @Post(':id/export')
  @UseGuards(JwtAuthGuard)
  async exportSubmission(
    @Param('id') id: string,
    @Body() body: { format: string },
    @Request() req,
    @Res() res: Response
  ) {
    try {
      const pdfBuffer = await this.submissionsService.exportSubmission(id, body.format, req.user.id, req.user.role);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=submission-${id}.pdf`,
        'Content-Length': pdfBuffer.length,
      });
      
      res.send(pdfBuffer);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to export submission: ${error.message}`);
    }
  }
}