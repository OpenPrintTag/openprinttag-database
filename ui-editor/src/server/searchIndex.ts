/**
 * In-memory search index for fast full-text search across all entities.
 * Auto-warms on server start in development mode.
 */

import { formatBytes } from '~/utils/format';

export type SearchResultType = 'brand' | 'material' | 'package' | 'container';

export type SearchResult = {
  type: SearchResultType;
  slug: string;
  name: string;
  brandSlug?: string;
  brandName?: string;
  materialType?: string;
  color?: string;
  score: number;
};

export type SearchFilters = {
  types?: SearchResultType[];
  materialType?: string;
  brand?: string;
};

// In-memory cache
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
  console.info('Search index invalidated, rebuilding...');

  // Trigger immediate rebuild in background
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

  // Prevent parallel builds - reuse existing promise
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

/**
 * Search the index with query and filters.
 */
export function search(
  index: SearchResult[],
  query: string,
  filters: SearchFilters,
  limit: number = 50,
): SearchResult[] {
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return [];
  }

  let filtered = index;

  // Apply type filter
  if (filters.types && filters.types.length > 0) {
    filtered = filtered.filter((item) => filters.types!.includes(item.type));
  }

  // Apply material type filter
  if (filters.materialType) {
    const mt = filters.materialType.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.type !== 'material' || item.materialType?.toLowerCase() === mt,
    );
  }

  // Apply brand filter
  if (filters.brand) {
    const b = filters.brand.toLowerCase();
    filtered = filtered.filter((item) => {
      if (item.type === 'brand') {
        return item.slug.toLowerCase() === b;
      }
      if (item.brandSlug) {
        return item.brandSlug.toLowerCase() === b;
      }
      return false;
    });
  }

  // Score and sort
  const scored = filtered
    .map((item) => ({
      ...item,
      score: scoreMatch(item, queryTokens, filters),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

// ============ Internal functions ============

async function buildIndex(): Promise<SearchResult[]> {
  const now = Date.now();
  const memBefore = process.memoryUsage().heapUsed;

  const {
    readAllEntities,
    readAllMaterialsAcrossBrands,
    readAllNestedAcrossBrands,
  } = await import('~/server/data/fs');

  const results: SearchResult[] = [];

  // Load brands
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

  // Load materials
  const materials = await readAllMaterialsAcrossBrands({
    validate: (obj) => !!obj && (!!obj.name || !!obj.slug),
  });
  if (Array.isArray(materials)) {
    for (const material of materials) {
      const brandSlug = material.__brand || material.brand?.slug;
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

  // Load packages
  const packages = await readAllNestedAcrossBrands('material-packages', {
    validate: (obj) => !!obj && (!!obj.slug || !!obj.gtin),
  });
  if (Array.isArray(packages)) {
    for (const pkg of packages) {
      const brandSlug = pkg.__brand;
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

  // Load containers
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

/**
 * Tokenize text for fuzzy search matching.
 *
 * Why tokenization is needed:
 * - Searching "galaxy black" should match "Prusament PLA Prusa Galaxy Black"
 * - Each word becomes a separate token that can match independently
 *
 * What this function does:
 * 1. Lowercase: "Galaxy" → "galaxy" (case-insensitive matching)
 * 2. Normalize NFKD: "café" → "cafe" (decompose accented chars to base + diacritic)
 * 3. Remove diacritics: strip combining marks (U+0300-U+036F) so "Černá" matches "cerna"
 * 4. Split on separators: "galaxy-black" → ["galaxy", "black"]
 * 5. Filter empty: remove any empty strings from result
 *
 * Example: "Prusament PLA-Black_v2" → ["prusament", "pla", "black", "v2"]
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[\s\-_]+/)
    .filter((t) => t.length > 0);
}

/**
 * Score weights based on search context.
 *
 * When brand filter is active:
 * - User is searching within a specific brand, so material name is most important
 * - Material type (PLA, PETG) helps narrow down results
 *
 * When searching globally:
 * - Brand name is important for recognition
 * - Material name matters, but brand helps differentiate
 * - Packages/containers have lower relevance
 */
type ScoreWeights = {
  nameExact: number;
  namePrefix: number;
  nameContains: number;
  brandExact: number;
  brandPrefix: number;
  slugContains: number;
  typeBonus: number; // bonus for entity type (brand > material > package/container)
};

const GLOBAL_WEIGHTS: ScoreWeights = {
  nameExact: 80,
  namePrefix: 60,
  nameContains: 40,
  brandExact: 100, // brand is most important in global search
  brandPrefix: 70,
  slugContains: 20,
  typeBonus: 50, // brands get bonus in global search
};

const BRAND_FILTERED_WEIGHTS: ScoreWeights = {
  nameExact: 100, // name is most important when brand is already filtered
  namePrefix: 80,
  nameContains: 50,
  brandExact: 20, // brand less relevant since it's already filtered
  brandPrefix: 10,
  slugContains: 30,
  typeBonus: 0, // no type bonus when searching within brand
};

function scoreMatch(
  item: SearchResult,
  queryTokens: string[],
  filters: SearchFilters,
): number {
  const weights = filters.brand ? BRAND_FILTERED_WEIGHTS : GLOBAL_WEIGHTS;
  const nameTokens = tokenize(item.name);
  const brandTokens = item.brandName ? tokenize(item.brandName) : [];
  const allTokens = [...nameTokens, ...brandTokens];

  let score = 0;
  let matchedTokens = 0;

  for (const qt of queryTokens) {
    let tokenMatched = false;

    // Name matching (highest priority when brand-filtered)
    if (nameTokens.includes(qt)) {
      score += weights.nameExact;
      tokenMatched = true;
    } else if (nameTokens.some((nt) => nt.startsWith(qt))) {
      score += weights.namePrefix;
      tokenMatched = true;
    } else if (nameTokens.some((nt) => nt.includes(qt))) {
      score += weights.nameContains;
      tokenMatched = true;
    }
    // Brand matching (highest priority in global search)
    else if (brandTokens.includes(qt)) {
      score += weights.brandExact;
      tokenMatched = true;
    } else if (brandTokens.some((bt) => bt.startsWith(qt))) {
      score += weights.brandPrefix;
      tokenMatched = true;
    }
    // Slug fallback
    else if (item.slug.toLowerCase().includes(qt)) {
      score += weights.slugContains;
      tokenMatched = true;
    }

    if (tokenMatched) {
      matchedTokens++;
    }
  }

  // Bonus for matching all query tokens
  if (matchedTokens === queryTokens.length && queryTokens.length > 0) {
    score += 50 * queryTokens.length;
  }

  // Entity type bonus (only in global search, and only if there's at least one match)
  if (weights.typeBonus > 0 && matchedTokens > 0) {
    if (item.type === 'brand') {
      score += weights.typeBonus;
    } else if (item.type === 'material') {
      score += weights.typeBonus * 0.6;
    }
    // packages and containers get no bonus
  }

  // Penalty for very long names (prefer concise matches)
  if (allTokens.length > 6) {
    score -= (allTokens.length - 6) * 2;
  }

  return score;
}

// Auto-warmup on server start
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    getSearchIndex().catch((err) => {
      console.error('Failed to warmup search index:', err);
    });
  }, 100);
}
