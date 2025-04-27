// /backend/src/submissions/submissions.service.ts
import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  async create(createSubmissionDto: CreateSubmissionDto) {
    // Check if form exists and is published
    const form = await this.prisma.form.findUnique({
      where: { id: createSubmissionDto.formId },
    });
    
    if (!form || !form.published) {
      throw new NotFoundException('Form not found or not published');
    }
    
    return this.prisma.submission.create({
      data: {
        formId: createSubmissionDto.formId,
        data: createSubmissionDto.data,
      },
    });
  }

// In /src/submissions/submissions.service.ts - update the findAll method
async findAll(userId: string, userRole: Role) {
  // Super admin can see all submissions
  if (userRole === Role.SUPER_ADMIN) {
    return this.prisma.submission.findMany({
      include: {
        form: {
          select: {
            id: true,
            title: true,
            slug: true,
            published: true,
            clientId: true,
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
    });
  }
  
  // Clients can only see submissions for their forms
  return this.prisma.submission.findMany({
    where: {
      form: {
        clientId: userId,
      },
    },
    include: {
      form: {
        select: {
          id: true,
          title: true,
          slug: true,
          published: true,
          clientId: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
  });
}

  async findByForm(formId: string, userId: string, userRole: Role) {
    // Check if form exists
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
    });
    
    if (!form) {
      throw new NotFoundException(`Form with ID ${formId} not found`);
    }
    
    // Check permissions
    if (userRole !== Role.SUPER_ADMIN && form.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to access submissions for this form');
    }
    
    return this.prisma.submission.findMany({
      where: { formId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        form: {
          include: {
            fields: true
          }
        },
      },
    });
    
    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }
    
    // Check permissions
    if (userRole !== Role.SUPER_ADMIN && submission.form.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to access this submission');
    }
    
    return submission;
  }

  async findSiblings(id: string, formId: string, userId: string, userRole: Role) {
    // Check permissions first
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
    });
    
    if (!form) {
      throw new NotFoundException(`Form with ID ${formId} not found`);
    }
    
    // Check permissions
    if (userRole !== Role.SUPER_ADMIN && form.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to access submissions for this form');
    }
    
    // Find the current submission to get its timestamp
    const currentSubmission = await this.prisma.submission.findUnique({
      where: { id },
      select: { createdAt: true },
    });
    
    if (!currentSubmission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }
    
    // Find the next submission (newer than the current one)
    const nextSubmission = await this.prisma.submission.findFirst({
      where: {
        formId,
        createdAt: { gt: currentSubmission.createdAt },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    
    // Find the previous submission (older than the current one)
    const previousSubmission = await this.prisma.submission.findFirst({
      where: {
        formId,
        createdAt: { lt: currentSubmission.createdAt },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    
    return {
      next: nextSubmission?.id || null,
      previous: previousSubmission?.id || null,
    };
  }

  async remove(id: string, userId: string, userRole: Role) {
    // Check if submission exists and user has permission
    await this.findOne(id, userId, userRole);
    
    await this.prisma.submission.delete({ where: { id } });
    return { id };
  }

  async exportSubmission(id: string, format: string, userId: string, userRole: Role): Promise<Buffer> {
    try {
      // Check if submission exists and user has permission
      const submission = await this.findOne(id, userId, userRole);
      
      if (format !== 'pdf') {
        throw new Error('Only PDF export is supported');
      }
      
      // Create PDF document
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      
      // Collect PDF chunks
      doc.on('data', (chunk) => chunks.push(chunk));
      
      // Add content to PDF
      doc.fontSize(20).text('Submission Details', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).text(`Form: ${submission.form.title}`);
      doc.text(`Submission ID: ${submission.id}`);
      doc.text(`Date: ${new Date(submission.createdAt).toLocaleString()}`);
      doc.moveDown();
      
      // Add form fields
      doc.fontSize(14).text('Responses:');
      doc.moveDown();
      
      submission.form.fields.forEach((field) => {
        doc.fontSize(12).text(`${field.label}:`, { continued: true });
        doc.text(` ${submission.data[field.id] || 'No response'}`);
        doc.moveDown();
      });
      
      // Finalize PDF
      doc.end();
      
      // Return PDF buffer
      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
        
        doc.on('error', (err) => {
          reject(new InternalServerErrorException(`Failed to generate PDF: ${err.message}`));
        });
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to export submission: ${error.message}`);
    }
  }
}