import './polyfills';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    bodyParser: true, // Enable bodyParser for file uploads
  });
  
  // Increase the maximum file size limit for uploads (20MB)
  app.use('/api/uploads', (req, res, next) => {
    const jsonBodyLimit = '20mb';
    const rawBodyLimit = '20mb';
    next();
  });
  
  const isDev = process.env.NODE_ENV !== 'production';
  logger.log(`Application running in ${isDev ? 'development' : 'production'} mode`);
  
  // Enable CORS with specific config - expanded for development
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Cache-Control',
      'X-Requested-With',
      'Accept',
      'Origin',
      'pragma',
      'Expires',
      'If-Modified-Since',
      'x-nextjs-data'
    ],
    exposedHeaders: ['Content-Length', 'Date', 'ETag'],
    // Explicitly set our cache control in development
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  
  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({ 
    transform: true,
    enableDebugMessages: isDev,
    forbidNonWhitelisted: true,
  }));

  // Set global prefix (optional)
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}
bootstrap();