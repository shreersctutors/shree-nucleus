import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts', 'tests/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 30000, // 30 seconds timeout for long-running tests
    reporters: ['default', 'html'],
    isolate: false, // speeds up tests and helps with shared state mocking
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/api/**/*.ts'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.prisma.ts', // Prisma has mock tests, so we don't need unit tests for it
        '**/*.types.ts'
      ],
      // Coverage thresholds to prevent regressions
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
