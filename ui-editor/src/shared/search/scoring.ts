/**
 * Pure search scoring logic. Browser-safe — no Node APIs, no `fs`, no `process`.
 *
 * The full server-side index is built in `~/server/searchIndex.ts` (Node-only)
 * and persisted as a static JSON snapshot under `public/api/search-index.json`
 * by the prerender script. In read-only/static builds, the client loads that
 * snapshot once and runs `search()` here against it; in writable builds the
 * server runs the same `search()` over its in-memory index.
 */

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

  if (filters.types && filters.types.length > 0) {
    filtered = filtered.filter((item) => filters.types!.includes(item.type));
  }

  if (filters.materialType) {
    const mt = filters.materialType.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.type !== 'material' || item.materialType?.toLowerCase() === mt,
    );
  }

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

/**
 * Tokenize text for fuzzy search matching.
 *
 * 1. Lowercase, 2. NFKD-normalize, 3. strip diacritics (so "Černá" matches
 * "cerna"), 4. split on whitespace/`-`/`_`, 5. drop empty tokens.
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

type ScoreWeights = {
  nameExact: number;
  namePrefix: number;
  nameContains: number;
  brandExact: number;
  brandPrefix: number;
  slugContains: number;
  typeBonus: number;
};

const GLOBAL_WEIGHTS: ScoreWeights = {
  nameExact: 80,
  namePrefix: 60,
  nameContains: 40,
  brandExact: 100,
  brandPrefix: 70,
  slugContains: 20,
  typeBonus: 50,
};

const BRAND_FILTERED_WEIGHTS: ScoreWeights = {
  nameExact: 100,
  namePrefix: 80,
  nameContains: 50,
  brandExact: 20,
  brandPrefix: 10,
  slugContains: 30,
  typeBonus: 0,
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

    if (nameTokens.includes(qt)) {
      score += weights.nameExact;
      tokenMatched = true;
    } else if (nameTokens.some((nt) => nt.startsWith(qt))) {
      score += weights.namePrefix;
      tokenMatched = true;
    } else if (nameTokens.some((nt) => nt.includes(qt))) {
      score += weights.nameContains;
      tokenMatched = true;
    } else if (brandTokens.includes(qt)) {
      score += weights.brandExact;
      tokenMatched = true;
    } else if (brandTokens.some((bt) => bt.startsWith(qt))) {
      score += weights.brandPrefix;
      tokenMatched = true;
    } else if (item.slug.toLowerCase().includes(qt)) {
      score += weights.slugContains;
      tokenMatched = true;
    }

    if (tokenMatched) {
      matchedTokens++;
    }
  }

  if (matchedTokens === queryTokens.length && queryTokens.length > 0) {
    score += 50 * queryTokens.length;
  }

  if (weights.typeBonus > 0 && matchedTokens > 0) {
    if (item.type === 'brand') {
      score += weights.typeBonus;
    } else if (item.type === 'material') {
      score += weights.typeBonus * 0.6;
    }
  }

  if (allTokens.length > 6) {
    score -= (allTokens.length - 6) * 2;
  }

  return score;
}
