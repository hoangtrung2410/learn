import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Frontend runs on its own port (5173) and proxies /api to the backend (3000).
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: BACKEND_URL, changeOrigin: true },
      },
    },
  };
});
