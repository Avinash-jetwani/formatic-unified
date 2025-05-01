import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { Webhook, WebhookAuthType } from '@prisma/client';

@Injectable()
export class WebhookSecurityService {
  private readonly logger = new Logger(WebhookSecurityService.name);

  /**
   * Generate HMAC signature for webhook payload
   */
  signPayload(payload: string, secretKey: string): string {
    const hmac = createHmac('sha256', secretKey);
    return `sha256=${hmac.update(payload).digest('hex')}`;
  }

  /**
   * Verify IP address against allowed list
   */
  verifyIpAddress(ipAddress: string, allowedIps: string[]): boolean {
    // If no restrictions, allow all
    if (!allowedIps || allowedIps.length === 0) {
      return true;
    }

    // Check exact matches
    if (allowedIps.includes(ipAddress)) {
      return true;
    }

    // Check CIDR notation
    return allowedIps.some(allowedIp => {
      if (allowedIp.includes('/')) {
        return this.ipMatchesCidr(ipAddress, allowedIp);
      }
      return false;
    });
  }

  /**
   * Build authentication headers based on webhook configuration
   */
  buildAuthHeaders(webhook: Webhook): Record<string, string> {
    const headers: Record<string, string> = {};
    
    switch (webhook.authType) {
      case WebhookAuthType.BEARER:
        headers['Authorization'] = `Bearer ${webhook.authValue}`;
        break;
      case WebhookAuthType.API_KEY:
        headers['X-API-Key'] = webhook.authValue;
        break;
      case WebhookAuthType.BASIC:
        const auth = Buffer.from(webhook.authValue || '').toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
        break;
      default:
        // No authentication
        break;
    }

    // Add verification token if present
    if (webhook.verificationToken) {
      headers['X-Webhook-Token'] = webhook.verificationToken;
    }
    
    return headers;
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secretKey: string): boolean {
    if (!secretKey || !signature) {
      return false;
    }

    const expectedSignature = this.signPayload(payload, secretKey);
    return this.timingSafeEqual(signature, expectedSignature);
  }

  /**
   * Timing-safe comparison of signatures to prevent timing attacks
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Check if an IP address matches a CIDR range
   */
  private ipMatchesCidr(ip: string, cidr: string): boolean {
    try {
      const [range, bits = '32'] = cidr.split('/');
      
      // Convert IP addresses to numeric values
      const mask = ~(2 ** (32 - parseInt(bits)) - 1);
      const ipNum = this.ipToNum(ip);
      const rangeNum = this.ipToNum(range);
      
      return (ipNum & mask) === (rangeNum & mask);
    } catch (error) {
      this.logger.error(`Error checking IP against CIDR: ${error.message}`);
      return false;
    }
  }

  /**
   * Convert IP address to numeric value
   */
  private ipToNum(ip: string): number {
    return ip.split('.')
      .reduce((sum, octet) => (sum << 8) + parseInt(octet, 10), 0) >>> 0;
  }
} 