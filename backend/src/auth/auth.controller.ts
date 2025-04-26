import { Controller, Post, Body, UseGuards, Request, Get, Query, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
  
  @Get('check-email')
  async checkEmail(@Query('email') email: string) {
    if (!email) {
      return { exists: false };
    }
    
    const user = await this.usersService.findByEmail(email);
    
    if (user) {
      throw new ConflictException('Email already exists');
    }
    
    return { exists: false };
  }
}