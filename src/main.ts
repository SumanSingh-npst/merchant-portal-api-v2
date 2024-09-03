import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomLogger } from './custom-logger';
import { ValidationPipe } from '@nestjs/common';
import * as path from 'path';
import * as express from 'express';
import { TokenValidationInterceptor } from './interceptors/token-validation.interceptor';
import { JwtService } from '@nestjs/jwt';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLogger(),
  });
  const jwtService = app.get(JwtService);
  //removed for dev
  // app.useGlobalInterceptors(new TokenValidationInterceptor(jwtService));
  app.use('/downloads', express.static(path.join(__dirname, 'downloads')));
  app.enableCors({ origin: '*' });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
