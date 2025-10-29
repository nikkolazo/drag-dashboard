// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Base path for sites hosted under a subpath (GitHub Pages repository pages)
  base: '/drag-dashboard/',
  output: 'static',
  cacheDir: './.astro',
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      force: true
    }
  },
});
