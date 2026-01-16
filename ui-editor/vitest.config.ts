import tsConfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsConfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
