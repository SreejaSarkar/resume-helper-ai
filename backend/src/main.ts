import * as dotenv from 'dotenv';
dotenv.config(); // 🔥 MUST be first

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';
import { observatory } from './observability/observatory';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT) || 5000;

  app.use('/files', express.static(path.join(process.cwd(), 'uploads')));
  app.useGlobalInterceptors(observatory.nest());

  app.enableCors();

  const shutdown = async () => {
    await observatory.shutdown();
  };

  process.once('SIGINT', () => {
    void shutdown();
  });

  process.once('SIGTERM', () => {
    void shutdown();
  });

  await app.listen(port);
}

bootstrap();
