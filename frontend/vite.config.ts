import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Frontend runs on its own port (5173) and proxies /api to the backend (3000).
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// `vite build --mode free`: bản tĩnh miễn phí, không backend, không đăng nhập, mở toàn bộ nội dung.
export default defineConfig(({mode}) => {
  return {
    define: {__FREE_MODE__: JSON.stringify(mode === 'free')},
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
