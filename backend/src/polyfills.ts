import * as crypto from 'crypto';

// Make crypto available globally (required for NestJS schedule in Node.js 18+)
(global as any).crypto = crypto; 