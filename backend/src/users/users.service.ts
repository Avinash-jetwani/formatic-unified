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

  async updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() }
    });
  }
}