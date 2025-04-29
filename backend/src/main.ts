import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Set global prefix (optional)
  app.setGlobalPrefix('api');
  
  await app.listen(process.env.PORT || 4000);
}
bootstrap();