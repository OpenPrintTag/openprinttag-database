/**
 * Render a single SPA shell `index.html` for the static GitHub Pages deploy.
 *
 * TanStack Start's build emits a Nitro server bundle (`dist/server/server.js`)
 * and the client assets (`dist/client/`) but no standalone HTML. For static
 * hosting we boot the server bundle in-process, request `/brands` once to get
 * a fully-hydratable HTML document with all script tags injected, then write
 * it as `index.html` and `404.html` in `dist/client/`. GitHub Pages serves
 * `404.html` for any unmatched path, so the React Router takes over for every
 * route and renders the right page client-side.
 *
 * Run after `vite build` (and after `prerender:api` so READ_ONLY data fetches
 * during the render hit prebuilt JSON, not the now-defunct Node handlers).
 */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const UI_EDITOR_DIR = path.resolve(SCRIPT_DIR, '..');
const CLIENT_DIR = path.resolve(UI_EDITOR_DIR, 'dist', 'client');
const SERVER_ENTRY = path.resolve(UI_EDITOR_DIR, 'dist', 'server', 'server.js');

const SHELL_PATH = '/brands';

async function main(): Promise<void> {
  process.env.READ_ONLY = 'true';
  process.env.NODE_ENV = 'production';

  const mod = await import(SERVER_ENTRY);
  const server: { fetch: (req: Request) => Promise<Response> } =
    mod.default ?? mod.server;
  if (!server || typeof server.fetch !== 'function') {
    throw new Error(`Server bundle at ${SERVER_ENTRY} has no fetch() export`);
  }

  const res = await server.fetch(
    new Request(`http://localhost${SHELL_PATH}`, { method: 'GET' }),
  );
  if (!res.ok) {
    throw new Error(
      `Shell render returned HTTP ${res.status}: ${await res.text()}`,
    );
  }

  const html = await res.text();

  await writeFile(path.join(CLIENT_DIR, 'index.html'), html, 'utf8');
  await writeFile(path.join(CLIENT_DIR, '404.html'), html, 'utf8');
  // Disable Jekyll on Pages so files starting with `_` (Vite's chunk
  // directory) are served as-is.
  await writeFile(path.join(CLIENT_DIR, '.nojekyll'), '', 'utf8');

  console.info(`Wrote SPA shell (${html.length} bytes) → ${CLIENT_DIR}`);
}

main().catch((err) => {
  console.error('SPA shell render failed:', err);
  process.exit(1);
});
