import './polyfills';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS with specific config
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  });
  
  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Set global prefix (optional)
  app.setGlobalPrefix('api');
  
  await app.listen(process.env.PORT || 4000);
}
bootstrap();