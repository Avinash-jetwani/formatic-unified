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
    
    // Exclude password before returning to most callers
    const { password, ...result } = user;
    return {
      ...result,
      formsCount: user._count.forms,
      submissionsCount
    };
  }

  // New method to get user with password hash, for internal auth use
  async findOneWithPassword(id: string) {
    const user = await this.prisma.user.findUnique({ 
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found internally`);
    }
    return user; // Returns full user object including password
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
    console.log(`Resetting password for user ID: ${id}`);
    
    try {
      // Update the user's password and reset token fields
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: { 
          password: password, // Password is already hashed at this point
          resetToken: null,
          resetTokenExpires: null,
          updatedAt: new Date()
        },
      });
      
      console.log(`Password reset successful for user: ${updatedUser.email}`);
      
      const { password: _, ...result } = updatedUser;
      return result;
    } catch (error) {
      console.error(`Error resetting password: ${error.message}`);
      throw error;
    }
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

  async updatePassword(userId: string, newPasswordHash: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: newPasswordHash, updatedAt: new Date() },
    });
    return { message: 'Password updated successfully' };
  }

  async saveResetToken(userId: string, resetToken: string, resetTokenExpires: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        resetToken,
        resetTokenExpires
      }
    });
  }

  async findByResetToken(token: string) {
    console.log(`Searching for user with reset token: ${token.substring(0, 10)}...`);
    
    const user = await this.prisma.user.findFirst({
      where: { 
        resetToken: token,
      }
    });
    
    if (user) {
      console.log(`Found user with email: ${user.email} for reset token`);
      console.log(`Token expires at: ${user.resetTokenExpires}`);
    } else {
      console.log('No user found with the provided reset token');
    }
    
    return user;
  }
}