/**
 * Static / read-only build flag.
 *
 * Set to `true` by `VITE_READ_ONLY=true pnpm build`. The same code is reused for
 * the writable Node deployment (flag false) and the static GitHub Pages snapshot
 * (flag true) — see `.github/workflows/deploy-pages.yml`.
 */
export const READ_ONLY: boolean =
  ((import.meta as { env?: Record<string, string | undefined> }).env
    ?.VITE_READ_ONLY ?? '') === 'true';

const BASE_PATH: string = (() => {
  const raw =
    (import.meta as { env?: Record<string, string | undefined> }).env
      ?.BASE_URL ?? '/';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
})();

/**
 * Map a runtime API URL to its build-time JSON snapshot in read-only mode.
 *
 * Writable build: returns the URL untouched.
 * Read-only build: rewrites `/api/foo/bar` → `<base>/api/foo/bar.json`. Query strings
 * are dropped — the only `GET` endpoint that uses them is `/api/schema?entity=…`,
 * which is migrated to the path-based form `/api/schema/<entity>` so the rewrite
 * is uniform.
 */
export function apiUrl(url: string): string {
  if (!READ_ONLY) return url;
  const qIdx = url.indexOf('?');
  const path = qIdx >= 0 ? url.slice(0, qIdx) : url;
  return `${BASE_PATH}${path}.json`;
}
