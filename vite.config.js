import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Tailwind v4 runs as a Vite plugin: there is no tailwind.config.js or postcss.config.js.
// All design tokens live in src/styles/tokens.css (@theme).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    // Phase 1 tests are pure-logic and server-render tests, so no DOM environment is needed.
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
