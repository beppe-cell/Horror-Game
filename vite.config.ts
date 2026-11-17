import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build works under the GitHub Pages sub-path.
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000, // Phaser alone is over the default limit.
  },
});
