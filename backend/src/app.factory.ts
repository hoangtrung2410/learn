import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AppModule } from './app.module.ts';
import { config } from './common/config.ts';

export async function createApp(opts: { quiet?: boolean } = {}) {
  const app = await NestFactory.create(AppModule, {
    cors: { origin: config.isProd() ? config.appUrl() : true, credentials: true },
    logger: opts.quiet ? false : undefined,
  });
  const server = app.getHttpAdapter().getInstance();
  server.disable('x-powered-by');
  server.use((_req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
  server.use(express.json({ limit: '25mb' }));

  // Chạy 1 cổng duy nhất: nếu đã build frontend (frontend/dist) thì backend phục vụ luôn giao diện.
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
  if (fs.existsSync(path.join(dist, 'index.html'))) {
    server.use(express.static(dist, { maxAge: '7d', index: false }));
    server.get(/^\/(?!api\/).*/, (_req: any, res: any) => res.sendFile(path.join(dist, 'index.html')));
    if (!opts.quiet) console.log('Serving built frontend from ' + dist);
  }
  return app;
}
