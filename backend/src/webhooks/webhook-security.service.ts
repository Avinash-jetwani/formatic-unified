import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class WebhookSecurityService {
  private readonly logger = new Logger(WebhookSecurityService.name);

  // Sign a payload with a secret key using HMAC-SHA256
  signPayload(payload: string, secretKey: string): string {
    if (!secretKey) {
      return '';
    }
    
    return crypto
      .createHmac('sha256', secretKey)
      .update(payload)
      .digest('hex');
  }

  // Verify that an IP address is in the allowed list
  verifyIpAddress(ipAddress: string, allowedIps: string[]): boolean {
    if (!allowedIps || allowedIps.length === 0) {
      return true; // No restrictions
    }
    
    return allowedIps.includes(ipAddress);
  }
} 