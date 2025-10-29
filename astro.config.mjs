// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  cacheDir: './.astro',
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      force: true
    }
  },
});
