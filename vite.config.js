import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/macpan2-model-builder/',  // 👈 important!,
  server: {
    open: true,
  },
});
