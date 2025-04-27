import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findByPrefix(prefix: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: {
          startsWith: prefix
        },
        role: 'CLIENT'
      },
      select: {
        id: true
      }
    });

    if (!user) {
      throw new NotFoundException(`Client with prefix ${prefix} not found`);
    }

    return user;
  }
} 