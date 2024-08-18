import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomLogger } from './custom-logger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLogger(),
  });
  app.enableCors({ origin: '*' });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
