// /backend/src/submissions/submissions.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

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
        form: true,
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
}