import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: false,
    watch: {
      usePolling: true,
      interval: 500
    }
  },
  build: {
    target: 'esnext'
  }
});
