import { defineConfig } from 'vite';
import { markdownContentPlugin } from './build/content.js';

export default defineConfig({
  cacheDir: '.wrangler/vite-cache',
  plugins: [markdownContentPlugin()],
});
