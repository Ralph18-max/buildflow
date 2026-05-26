import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/app/core/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/app/core/**/*.ts'],
    },
  },
});
