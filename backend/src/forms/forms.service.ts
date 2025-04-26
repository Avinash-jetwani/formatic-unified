import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormFieldDto } from './dto/create-form-field.dto';
import { UpdateFormFieldDto } from './dto/update-form-field.dto';
import { Role } from '@prisma/client';

@Injectable()
export class FormsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createFormDto: CreateFormDto) {
    // Generate a slug if not provided
    const slug = createFormDto.slug || this.generateSlug(createFormDto.title);
    
    return this.prisma.form.create({
      data: {
        ...createFormDto,
        slug,
        clientId: userId,
      },
      include: {
        fields: true,
      },
    });
  }

  async findAll(userId: string, userRole: Role) {
    // Super admin can see all forms
    if (userRole === Role.SUPER_ADMIN) {
      return this.prisma.form.findMany({
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              submissions: true,
              fields: true,
            },
          },
        },
      });
    }
    
    // Clients can only see their own forms
    return this.prisma.form.findMany({
      where: {
        clientId: userId,
      },
      include: {
        _count: {
          select: {
            submissions: true,
            fields: true,
          },
        },
      },
    });
  }
  async findOne(id: string, userId: string, userRole: Role) {
    const form = await this.prisma.form.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: {
            order: 'asc',
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!form) {
      throw new NotFoundException(`Form with ID ${id} not found`);
    }
    
    // Check permissions
    if (userRole !== Role.SUPER_ADMIN && form.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to access this form');
    }
    
    return form;
  }

  async findBySlug(clientId: string, slug: string) {
    const form = await this.prisma.form.findFirst({
      where: {
        clientId,
        slug,
        published: true,
      },
      include: {
        fields: {
          orderBy: {
            order: 'asc',
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!form) {
      throw new NotFoundException('Form not found');
    }
    
    return form;
  }

  async update(id: string, userId: string, userRole: Role, updateFormDto: UpdateFormDto) {
    // Check if form exists and user has permission
    await this.findOne(id, userId, userRole);
    
    return this.prisma.form.update({
      where: { id },
      data: updateFormDto,
      include: {
        fields: true,
      },
    });
  }

  async remove(id: string, userId: string, userRole: Role) {
    // Check if form exists and user has permission
    await this.findOne(id, userId, userRole);
    
    await this.prisma.form.delete({ where: { id } });
    return { id };
  }

  async addField(
    formId: string,
    userId: string,
    userRole: Role,
    createFormFieldDto: CreateFormFieldDto
  ) {
    await this.findOne(formId, userId, userRole);
  
    return this.prisma.formField.create({
      data: {
        formId,
        ...createFormFieldDto,
        // config will be undefined if none provided, which is fine
      },
    });
  }
  
  async updateField(
    formId: string,
    fieldId: string,
    userId: string,
    userRole: Role,
    updateFormFieldDto: UpdateFormFieldDto
  ) {
    await this.findOne(formId, userId, userRole);
  
    const field = await this.prisma.formField.findUnique({ where: { id: fieldId } });
    if (!field || field.formId !== formId) {
      throw new NotFoundException(`Field ${fieldId} not found in form ${formId}`);
    }
  
    return this.prisma.formField.update({
      where: { id: fieldId },
      data: {
        ...updateFormFieldDto,
        // this will merge in any new config keys or overwrite existing
      },
    });
  }

  async removeField(formId: string, fieldId: string, userId: string, userRole: Role) {
    // Check if form exists and user has permission
    await this.findOne(formId, userId, userRole);
    
    // Check if field exists
    const field = await this.prisma.formField.findUnique({
      where: { id: fieldId },
    });
    
    if (!field || field.formId !== formId) {
      throw new NotFoundException(`Field with ID ${fieldId} not found in form ${formId}`);
    }
    
    await this.prisma.formField.delete({ where: { id: fieldId } });
    return { id: fieldId };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')  // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .slice(0, 50)             // Limit length
      + '-' + Date.now().toString().slice(-6);  // Add timestamp suffix for uniqueness
  }
}