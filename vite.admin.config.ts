import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' })],
  build: {
    outDir: 'dist/browser',
    emptyOutDir: false,
    lib: {
      entry: resolve(currentDir, 'src/admin-page.tsx'),
      name: 'PlankAddonContentHealthAdmin',
      formats: ['iife'],
      fileName: () => 'admin.js',
    },
    rollupOptions: {
      external: ['react'],
      output: {
        globals: {
          react: 'React',
        },
      },
    },
  },
})
