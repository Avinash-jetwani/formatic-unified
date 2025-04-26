import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { Role, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      return null;
    }
    
    // Check if user is active
    if (user.status === UserStatus.LOCKED) {
      throw new UnauthorizedException('Your account is locked. Please contact support.');
    }
    
    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Your account is inactive. Please contact support.');
    }
    
    // Verify password
    if (await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    
    return null;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.validateUser(email, password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // Update last login time
    await this.usersService.updateLastLogin(user.id);
    
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role,
      name: user.name 
    };
    
    return {
      user,
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: RegisterDto) {
    // We set the role to CLIENT by default for new registrations
    // and status to ACTIVE
    return this.usersService.create({
      ...registerDto,
      role: Role.CLIENT,
      status: UserStatus.ACTIVE,
    });
  }
}