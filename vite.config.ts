import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { leetcodeAcDevApi } from './vite-plugins/leetcodeAcDevApi';

export default defineConfig(({ mode, command }) => {
  if (mode === 'e2e' && command === 'build') throw new Error('E2E authentication mocks cannot be built for deployment');
  return {
    plugins: [react(), tailwindcss(), leetcodeAcDevApi()],
    resolve: {
      alias: [
        ...(mode === 'e2e' ? [{ find: /^@clerk\/react(?:\/legacy)?$/, replacement: path.resolve(__dirname, 'e2e/fixtures/clerk.tsx') }] : []),
        { find: '@', replacement: path.resolve(__dirname, '.') },
      ],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('leetcodeExtendedCatalog.json')) return 'extended-catalog';
            if (id.includes('leetcodePremiumStatus.json')) return 'premium-status';
            if (id.includes('node_modules/@clerk')) return 'clerk';
            if (id.includes('node_modules/@codemirror') || id.includes('node_modules/@uiw/react-codemirror')) {
              return 'codemirror';
            }
            if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) {
              return 'motion';
            }
            if (id.includes('node_modules/recharts')) return 'recharts';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
