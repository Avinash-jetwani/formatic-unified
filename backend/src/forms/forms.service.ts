import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormFieldDto } from './dto/create-form-field.dto';
import { UpdateFormFieldDto } from './dto/update-form-field.dto';
import { Role, Form } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class FormsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createFormDto: CreateFormDto) {
    // Generate a slug if not provided
    const slug = await this.generateSlug(createFormDto.title, userId);
    
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

  // New method to find a form by slug only without requiring clientId
  async findBySlugOnly(slug: string) {
    // Extract the userId prefix from the slug (if it exists in our new format)
    // Format: base-slug-userIdPrefix-timestamp
    let slugParts = slug.split('-');
    let clientIdPrefix = null;
    
    // If slug has our expected format with at least 3 parts and the 3rd from last part might be a userId prefix
    if (slugParts.length >= 3) {
      // The userId prefix should be the third from last segment in the new format
      const potentialIdIndex = slugParts.length - 3;
      const potentialId = slugParts[potentialIdIndex];
      
      // If it looks like a userId prefix (8 chars, alphanumeric)
      if (potentialId && potentialId.length === 8 && /^[a-zA-Z0-9]+$/.test(potentialId)) {
        clientIdPrefix = potentialId;
      }
    }
    
    // First try to find by exact slug
    const form = await this.prisma.form.findFirst({
      where: {
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
    
    if (form) {
      return form;
    }
    
    // If not found and we've identified a client prefix, try to find forms from that client
    if (clientIdPrefix) {
      const clientForms = await this.prisma.form.findMany({
        where: {
          clientId: {
            startsWith: clientIdPrefix
          },
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
      
      // If we find forms from this client, suggest them (return the first published one)
      if (clientForms.length > 0) {
        const publishedForms = clientForms.filter(f => f.published);
        if (publishedForms.length > 0) {
          return publishedForms[0];
        }
      }
    }
    
    throw new NotFoundException('Form not found. The form may have been removed or is no longer available.');
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

  async updateFields(
    id: string,
    userId: string,
    userRole: string,
    fields: Prisma.FormFieldCreateInput[]
  ): Promise<Form> {
    const form = await this.prisma.form.findUnique({
      where: { id },
      include: { 
        fields: true,
        client: true,
      },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID ${id} not found`);
    }

    // Check permissions
    if (userRole !== 'ADMIN' && form.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to update this form');
    }

    // Use a transaction to ensure all operations succeed or fail together
    return this.prisma.$transaction(async (prisma) => {
      // First, delete all existing fields to avoid conflicts
      await prisma.formField.deleteMany({
        where: { formId: id },
      });
      
      // Then create all fields with their new order values
      const createdFields = await Promise.all(
        fields.map((field, index) => {
          // Extract only allowed properties for each field
          // to prevent validation errors with extra properties
          const {
            label,
            type,
            placeholder,
            required,
            options,
            config
          } = field;
          
          return prisma.formField.create({
            data: {
              label,
              type,
              placeholder,
              required,
              options,
              config,
              order: index, // Set explicit order based on array position
              formId: id, // Using direct foreign key instead of relation
            },
          });
        })
      );

      // Finally, return the updated form with new fields
      return prisma.form.findUnique({
        where: { id },
        include: {
          fields: {
            orderBy: { order: 'asc' },
          },
          client: true,
        },
      });
    });
  }

  async remove(id: string, userId: string, userRole: Role) {
    // Check if form exists and user has permission
    await this.findOne(id, userId, userRole);
    
    // Use a transaction to ensure all operations succeed or fail together
    return this.prisma.$transaction(async (prisma) => {
      // First, delete all submissions associated with the form
      await prisma.submission.deleteMany({
        where: { formId: id },
      });
      
      // Then delete the form (form fields will be deleted automatically due to onDelete: Cascade)
      await prisma.form.delete({ where: { id } });
      
      return { id };
    });
  }

  async addField(
    formId: string,
    userId: string,
    userRole: Role,
    createFormFieldDto: CreateFormFieldDto
  ) {
    await this.findOne(formId, userId, userRole);
  
    // Extract fields from DTO to avoid mixing formId with form relation
    const {
      type,
      label,
      placeholder,
      required,
      options,
      order,
      page,
      config,
      conditions
    } = createFormFieldDto;

    return this.prisma.formField.create({
      data: {
        formId,
        type,
        label,
        placeholder,
        required,
        options,
        order,
        page,
        config,
        conditions
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

  private async generateSlug(title: string, userId: string): Promise<string> {
    // Base slug from title
    const baseSlug = title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')  // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .trim()
      .slice(0, 40);            // Limit length (shorter to allow room for unique identifiers)
    
    // Add userId prefix (first 8 chars) for company uniqueness
    const companyPrefix = userId.slice(0, 8);
    
    // Add timestamp for uniqueness within the same company
    const timestamp = Date.now().toString().slice(-6);
    
    // Create the initial slug
    const initialSlug = `${baseSlug}-${companyPrefix}-${timestamp}`;
    
    // Check if a form with this slug already exists
    const existingForm = await this.prisma.form.findUnique({
      where: { slug: initialSlug },
    });
    
    // If slug already exists, add a random suffix (rare edge case)
    if (existingForm) {
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `${initialSlug}-${randomSuffix}`;
    }
    
    return initialSlug;
  }

  // Method to duplicate an existing form
  async duplicate(id: string, userId: string, role: Role) {
    const form = await this.findOne(id, userId, role);
    
    // Create a new title and slug
    const newTitle = `${form.title} (Copy)`;
    const newSlug = await this.generateUniqueSlug(form.slug);
    
    // Create a duplicate form first
    const newForm = await this.prisma.form.create({
      data: {
        title: newTitle,
        slug: newSlug,
        description: form.description,
        published: false, // Start as unpublished
        clientId: form.client.id,
      },
      include: {
        fields: true,
      },
    });
    
    // Duplicate all the fields
    if (form.fields && form.fields.length > 0) {
      await this.prisma.formField.createMany({
        data: form.fields.map(field => ({
          formId: newForm.id,
          type: field.type,
          label: field.label,
          placeholder: field.placeholder,
          required: field.required,
          options: field.options,
          order: field.order,
          config: field.config,
        })),
      });
    }
    
    // Return the new form with fields
    return this.findOne(newForm.id, userId, role);
  }

  private async generateUniqueSlug(baseSlug: string) {
    let slug = `${baseSlug}-copy`;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const existingForm = await this.prisma.form.findFirst({
        where: { slug },
      });

      if (!existingForm) {
        isUnique = true;
      } else {
        counter++;
        slug = `${baseSlug}-copy-${counter}`;
      }
    }

    return slug;
  }
}