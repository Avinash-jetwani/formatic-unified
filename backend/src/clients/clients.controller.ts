import { Controller, Get, Param } from '@nestjs/common';
import { ClientsService } from './clients.service';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('by-prefix/:prefix')
  async findByPrefix(@Param('prefix') prefix: string) {
    return this.clientsService.findByPrefix(prefix);
  }
} 