import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

/**
 * Vite plugin to warmup search index on dev server start.
 * Uses Vite's ssrLoadModule to properly resolve ~ aliases.
 */
function searchIndexWarmup(): Plugin {
  return {
    name: 'search-index-warmup',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        // Use ssrLoadModule which respects tsconfig paths
        server.ssrLoadModule('/src/server/searchIndex.ts').catch(() => {
          // Ignore - warmup is best-effort
        });
      });
    },
  };
}

export default defineConfig({
  // Allow GitHub Pages-style sub-path deploys: VITE_BASE_PATH=/openprinttag-database/.
  // Defaults to '/' for local dev and the writable Node deploy.
  base: process.env.VITE_BASE_PATH ?? '/',
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    searchIndexWarmup(),
    tanstackStart({
      srcDirectory: 'src',
    }),
    viteReact(),
  ],
});
