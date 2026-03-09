import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'path';

export default defineConfig({
  plugins: [angular() as any],

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [resolve(__dirname, 'src/test-setup.ts')],
    include: ['src/**/*.{test,spec}.{js,ts}'],

    server: {
      deps: {
        inline: [
          'rxfire',
          'firebase',
          '@angular/fire'
        ]
      }
    },

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        '**/*.spec.ts',
        '**/*.config.ts'
      ]
    }
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});