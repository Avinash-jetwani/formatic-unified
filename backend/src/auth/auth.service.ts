import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import { Role, UserStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
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

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password cannot be the same as the current password.');
    }

    const user = await this.usersService.findOneWithPassword(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordMatching = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid current password');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(userId, hashedNewPassword);

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // For security reasons, we don't want to reveal if a user exists or not
      return { message: 'If your email is registered, you will receive a password reset link shortly.' };
    }

    // Generate a reset token (random string)
    const resetToken = randomBytes(32).toString('hex');
    
    // Token expires in 24 hours
    const resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Save the token to the user record
    await this.usersService.saveResetToken(user.id, resetToken, resetTokenExpires);
    
    // Send email with the reset token
    await this.emailService.sendPasswordResetEmail(user.email, resetToken, user.name);
    
    return { message: 'If your email is registered, you will receive a password reset link shortly.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, password } = resetPasswordDto;
    
    if (!token) {
      throw new BadRequestException('Reset token is required');
    }

    // Find user by reset token
    const user = await this.usersService.findByResetToken(token);
    
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token. Please request a new password reset.');
    }
    
    // Check if token is expired
    if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      throw new BadRequestException('Reset token has expired. Please request a new password reset.');
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user password and clear reset token
    await this.usersService.resetPassword(user.id, hashedPassword);
    
    console.log(`Password reset successful for user: ${user.email}`);
    
    return { message: 'Password has been reset successfully. You can now login with your new password.' };
  }
}