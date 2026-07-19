import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const base = process.env.EASYJAK_BASE || './';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
