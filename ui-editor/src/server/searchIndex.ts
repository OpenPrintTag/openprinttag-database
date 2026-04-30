/**
 * Server-side search index: builds an in-memory `SearchResult[]` from the YAML
 * data tree and serves it to `/api/search`. Auto-warms on dev start; invalidated
 * by mutating handlers in `~/server/http`.
 *
 * Pure scoring logic (the `search` function and its helpers) lives in
 * `~/shared/search/scoring.ts` so it can run in the browser against the
 * pre-built index snapshot for read-only / static deployments.
 */

import {
  search,
  type SearchFilters,
  type SearchResult,
  type SearchResultType,
} from '~/shared/search/scoring';
import { formatBytes } from '~/utils/format';

// Re-export shared types so existing imports from this module keep working.
export { search };
export type { SearchFilters, SearchResult, SearchResultType };

let searchIndex: SearchResult[] | null = null;
let indexBuiltAt: number = 0;
let indexBuildPromise: Promise<SearchResult[]> | null = null;
const INDEX_TTL = 1000 * 60 * 10; // 10 minutes

/**
 * Invalidate the search index and trigger immediate rebuild.
 * Call this after data changes (create, update, delete).
 */
export function invalidateSearchIndex(): void {
  searchIndex = null;
  indexBuiltAt = 0;

  if (process.env.NODE_ENV === 'test') {
    return;
  }

  console.info('Search index invalidated, rebuilding...');

  getSearchIndex().catch((err) => {
    console.error('Failed to rebuild search index:', err);
  });
}

/**
 * Get or build the search index.
 * Returns cached index if fresh, otherwise rebuilds.
 */
export async function getSearchIndex(): Promise<SearchResult[]> {
  const now = Date.now();
  if (searchIndex && now - indexBuiltAt < INDEX_TTL) {
    return searchIndex;
  }

  if (indexBuildPromise) {
    return indexBuildPromise;
  }

  indexBuildPromise = buildIndex();
  try {
    return await indexBuildPromise;
  } finally {
    indexBuildPromise = null;
  }
}

export async function buildIndex(): Promise<SearchResult[]> {
  const now = Date.now();
  const memBefore = process.memoryUsage().heapUsed;

  const {
    readAllEntities,
    readAllMaterialsAcrossBrands,
    readAllNestedAcrossBrands,
  } = await import('~/server/data/fs');

  const results: SearchResult[] = [];

  const brands = await readAllEntities('brands', {
    validate: (obj) => !!obj && (!!obj.name || !!obj.slug),
  });
  const brandNameMap = new Map<string, string>();

  if (Array.isArray(brands)) {
    for (const brand of brands) {
      const slug = brand.slug || brand.__file?.replace(/\.ya?ml$/i, '');
      const name = brand.name || slug;
      brandNameMap.set(slug, name);
      results.push({ type: 'brand', slug, name, score: 0 });
    }
  }

  const materials = await readAllMaterialsAcrossBrands({
    validate: (obj) => !!obj && (!!obj.name || !!obj.slug),
  });
  if (Array.isArray(materials)) {
    for (const material of materials) {
      const brandSlug = material.brand?.slug;
      results.push({
        type: 'material',
        slug: material.slug || material.__file?.replace(/\.ya?ml$/i, ''),
        name: material.name || material.slug,
        brandSlug,
        brandName: brandNameMap.get(brandSlug),
        materialType: material.type,
        color: material.primary_color?.color_rgba,
        score: 0,
      });
    }
  }

  const packages = await readAllNestedAcrossBrands('material-packages', {
    validate: (obj) => !!obj && (!!obj.slug || !!obj.gtin),
  });
  if (Array.isArray(packages)) {
    for (const pkg of packages) {
      const brandSlug = pkg.brand?.slug;
      results.push({
        type: 'package',
        slug: pkg.slug || pkg.__file?.replace(/\.ya?ml$/i, ''),
        name: pkg.slug?.replace(/-/g, ' ') || pkg.gtin || 'Unknown Package',
        brandSlug,
        brandName: brandNameMap.get(brandSlug),
        score: 0,
      });
    }
  }

  const containers = await readAllEntities('material-containers', {
    validate: (obj) => !!obj && (!!obj.name || !!obj.slug),
  });
  if (Array.isArray(containers)) {
    for (const container of containers) {
      results.push({
        type: 'container',
        slug: container.slug || container.__file?.replace(/\.ya?ml$/i, ''),
        name: container.name || container.slug,
        score: 0,
      });
    }
  }

  searchIndex = results;
  indexBuiltAt = now;

  const memAfter = process.memoryUsage().heapUsed;
  const memUsed = memAfter - memBefore;
  console.info(
    `Search index built: ${results.length} items in ${Date.now() - now}ms (memory: +${formatBytes(memUsed)}, heap: ${formatBytes(memAfter)})`,
  );

  return results;
}

// Auto-warmup on server start
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    getSearchIndex().catch((err) => {
      console.error('Failed to warmup search index:', err);
    });
  }, 100);
}
