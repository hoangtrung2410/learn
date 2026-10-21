import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load backend/.env regardless of the directory the process is started from.
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const { createApp } = await import('./app.factory.ts');

export async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`LinguaPulse backend API running at http://localhost:${port}`);
}

bootstrap();
