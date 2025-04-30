import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, name, role, status, company, phone, website } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        company,
        phone,
        website,
        role,
        status, // Add status field
        lastLogin: null, // Initialize lastLogin as null
      },
    });

    // Exclude password from response
    const { password: _, ...result } = user;
    return result;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        _count: {
          select: {
            forms: true
          }
        }
      }
    });
    
    // Get submission counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const submissionsCount = await this.prisma.submission.count({
          where: {
            form: {
              clientId: user.id
            }
          }
        });
        
        const { password, ...rest } = user;
        return {
          ...rest,
          formsCount: user._count.forms,
          submissionsCount
        };
      })
    );
    
    return usersWithStats;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ 
      where: { id },
      include: {
        _count: {
          select: {
            forms: true
          }
        }
      }
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // Get submission count
    const submissionsCount = await this.prisma.submission.count({
      where: {
        form: {
          clientId: id
        }
      }
    });
    
    const { password, ...result } = user;
    return {
      ...result,
      formsCount: user._count.forms,
      submissionsCount
    };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Check if user exists
    await this.findOne(id);

    const data: any = { ...updateUserDto };
    
    // Hash the password if provided
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });
    
    const { password, ...result } = updatedUser;
    return result;
  }

  async remove(id: string) {
    // Check if user exists
    await this.findOne(id);
    
    await this.prisma.user.delete({ where: { id } });
    return { id };
  }

  async getUserStats(userId: string) {
    // Get number of forms created by the user
    const formsCount = await this.prisma.form.count({
      where: { clientId: userId }
    });
    
    // Get number of submissions across all user's forms
    const submissionsCount = await this.prisma.submission.count({
      where: {
        form: {
          clientId: userId
        }
      }
    });
    
    return {
      formsCount,
      submissionsCount
    };
  }

  async resetPassword(id: string, password: string) {
    // Check if user exists
    await this.findOne(id);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
    
    const { password: _, ...result } = updatedUser;
    return result;
  }

  async getUserDetailedStats(userId: string) {
    // Check if user exists
    await this.findOne(userId);
    
    // Get forms created by this user
    const forms = await this.prisma.form.findMany({
      where: { clientId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        published: true
      }
    });
    
    // Get submissions for all forms by this user
    const formIds = forms.map(form => form.id);
    const submissions = formIds.length > 0 ? await this.prisma.submission.findMany({
      where: { formId: { in: formIds } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        formId: true,
        createdAt: true,
        updatedAt: true,
        form: {
          select: {
            title: true
          }
        }
      }
    }) : [];
    
    // Create activity log from forms and submissions activities
    const activityLog = [
      ...forms.map(form => ({
        id: `form-${form.id}`,
        type: form.published ? 'form_published' : 'form_created',
        date: form.createdAt,
        details: `Created form: ${form.title}`
      })),
      ...submissions.map(sub => ({
        id: `sub-${sub.id}`,
        type: 'submission_received',
        date: sub.createdAt,
        details: `New submission received for: ${sub.form.title || 'Unknown form'}`
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Create form list for UI display
    const formsList = forms.map(form => ({
      id: form.id,
      title: form.title
    }));
    
    // Get count stats
    const formsCount = forms.length;
    const submissionsCount = submissions.length;
    
    return {
      formsCount,
      submissionsCount,
      formsList,
      activityLog
    };
  }

  async updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() }
    });
  }
}