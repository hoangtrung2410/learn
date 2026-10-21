import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { AppModule } from './app.module.ts';

// Load backend/.env regardless of the directory the process is started from.
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: { origin: true, credentials: true },
  });
  app.getHttpAdapter().getInstance().use(express.json({ limit: '25mb' }));

  // Chạy 1 cổng duy nhất: nếu đã build frontend (frontend/dist) thì backend phục vụ luôn giao diện.
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
  if (fs.existsSync(path.join(dist, 'index.html'))) {
    const server = app.getHttpAdapter().getInstance();
    server.use(express.static(dist, { maxAge: '7d', index: false }));
    server.get(/^\/(?!api\/).*/, (_req: any, res: any) => res.sendFile(path.join(dist, 'index.html')));
    console.log('Serving built frontend from ' + dist);
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`LinguaPulse backend API running at http://localhost:${port}`);
}

bootstrap();
