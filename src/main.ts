import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // This tells Nest to validate EVERY request based on the DTO decorators
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips away any extra fields not in the DTO
    forbidNonWhitelisted: true, // Throws error if extra fields are sent
    transform: true, // Automatically converts plain objects to Class instances
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
