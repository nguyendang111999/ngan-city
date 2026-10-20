import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build works on any static host or sub-path.
  base: './',
  build: {
    // Phaser alone is ~1.2 MB minified; that's expected.
    chunkSizeWarningLimit: 2000,
  },
});
