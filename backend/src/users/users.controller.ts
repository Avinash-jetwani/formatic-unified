import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateEmailPreferencesDto } from './dto/update-email-preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  resetPassword(@Param('id') id: string, @Body() resetPasswordDto: { password: string }) {
    return this.usersService.resetPassword(id, resetPasswordDto.password);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  getUserStats(@Param('id') id: string) {
    return this.usersService.getUserDetailedStats(id);
  }

  @Get(':id/email-preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user email notification preferences' })
  @ApiResponse({ status: 200, description: 'Email preferences retrieved successfully' })
  getEmailPreferences(@Param('id') id: string, @Request() req: any) {
    return this.usersService.getEmailPreferences(id, req.user.id, req.user.role);
  }

  @Patch(':id/email-preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user email notification preferences' })
  @ApiResponse({ status: 200, description: 'Email preferences updated successfully' })
  updateEmailPreferences(
    @Param('id') id: string,
    @Body() updateEmailPreferencesDto: UpdateEmailPreferencesDto,
    @Request() req: any
  ) {
    return this.usersService.updateEmailPreferences(id, updateEmailPreferencesDto, req.user.id, req.user.role);
  }
}