import { defineConfig } from 'vite';

export default defineConfig({
  base: '/maze-game/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 3000
  }
});
