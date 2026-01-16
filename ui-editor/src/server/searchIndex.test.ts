import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the fs module before importing searchIndex
vi.mock('~/server/data/fs', () => ({
  readAllEntities: vi.fn(),
  readAllMaterialsAcrossBrands: vi.fn(),
  readAllNestedAcrossBrands: vi.fn(),
}));

// Import after mocking
import { getSearchIndex, search, invalidateSearchIndex } from './searchIndex';
import type { SearchResult, SearchFilters } from './searchIndex';

describe('searchIndex', () => {
  beforeEach(() => {
    // Reset index before each test
    invalidateSearchIndex();
    vi.clearAllMocks();
  });

  describe('search scoring', () => {
    const mockIndex: SearchResult[] = [
      { type: 'brand', slug: 'prusament', name: 'Prusament', score: 0 },
      { type: 'brand', slug: 'bambulab', name: 'Bambu Lab', score: 0 },
      {
        type: 'material',
        slug: 'prusament-pla-galaxy-black',
        name: 'Prusament PLA Galaxy Black',
        brandSlug: 'prusament',
        brandName: 'Prusament',
        materialType: 'PLA',
        score: 0,
      },
      {
        type: 'material',
        slug: 'prusament-petg-prusa-orange',
        name: 'Prusament PETG Prusa Orange',
        brandSlug: 'prusament',
        brandName: 'Prusament',
        materialType: 'PETG',
        score: 0,
      },
      {
        type: 'material',
        slug: 'bambu-pla-basic-black',
        name: 'Bambu PLA Basic Black',
        brandSlug: 'bambulab',
        brandName: 'Bambu Lab',
        materialType: 'PLA',
        score: 0,
      },
      {
        type: 'container',
        slug: 'spool-750g',
        name: 'Spool 750g',
        score: 0,
      },
    ];

    it('should find brands by name', () => {
      const results = search(mockIndex, 'prusament', {});
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].slug).toBe('prusament');
    });

    it('should find materials by name', () => {
      const results = search(mockIndex, 'galaxy black', {});
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Galaxy Black');
    });

    it('should find materials by material type', () => {
      const results = search(mockIndex, 'PLA', {});
      expect(results.length).toBeGreaterThan(0);
      // Top results should contain PLA in name
      expect(results[0].name).toContain('PLA');
    });

    it('should filter by type', () => {
      const filters: SearchFilters = { types: ['brand'] };
      const results = search(mockIndex, 'prusament', filters);
      expect(results.every((r) => r.type === 'brand')).toBe(true);
    });

    it('should filter by brand', () => {
      const filters: SearchFilters = { brand: 'prusament' };
      const results = search(mockIndex, 'PLA', filters);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.brandSlug === 'prusament' || r.type === 'brand')).toBe(true);
    });

    it('should return empty for no matches', () => {
      const results = search(mockIndex, 'xyz123randomquery', {});
      expect(results).toHaveLength(0);
    });

    it('should handle diacritics', () => {
      const indexWithDiacritics: SearchResult[] = [
        { type: 'material', slug: 'cerna', name: 'Černá', score: 0 },
      ];
      const results = search(indexWithDiacritics, 'cerna', {});
      expect(results.length).toBeGreaterThan(0);
    });

    it('should prioritize exact matches over partial', () => {
      const results = search(mockIndex, 'prusament', {});
      // Brand "Prusament" should score higher than materials containing "Prusament"
      const brandIndex = results.findIndex((r) => r.type === 'brand' && r.slug === 'prusament');
      expect(brandIndex).toBe(0);
    });

    it('should prioritize name matches when brand filter is active', () => {
      const filters: SearchFilters = { brand: 'prusament' };
      const results = search(mockIndex, 'galaxy', filters);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Galaxy');
    });

    it('should handle empty query', () => {
      const results = search(mockIndex, '', {});
      // Empty query returns no results (no tokens to match)
      expect(results).toHaveLength(0);
    });

    it('should handle whitespace-only query', () => {
      const results = search(mockIndex, '   ', {});
      // Whitespace-only query returns no results (no tokens to match)
      expect(results).toHaveLength(0);
    });

    it('should respect limit parameter', () => {
      const results = search(mockIndex, 'pla', {}, 2);
      expect(results.length).toBeLessThanOrEqual(2);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find containers', () => {
      const results = search(mockIndex, 'spool', {});
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.type === 'container')).toBe(true);
    });

    it('should filter by multiple types', () => {
      const filters: SearchFilters = { types: ['brand', 'container'] };
      const results = search(mockIndex, 'prus', filters);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.type === 'brand' || r.type === 'container')).toBe(true);
    });

    it('should combine type and brand filters', () => {
      const filters: SearchFilters = { types: ['material'], brand: 'prusament' };
      const results = search(mockIndex, 'pla', filters);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.type === 'material' && r.brandSlug === 'prusament')).toBe(true);
    });

    it('should match partial words (prefix match)', () => {
      const results = search(mockIndex, 'gala', {}); // partial of "galaxy"
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Galaxy');
    });

    it('should score multi-token queries higher when all tokens match', () => {
      const results = search(mockIndex, 'prusament pla', {});
      expect(results.length).toBeGreaterThan(0);
      // Should find the Prusament PLA material
      expect(results[0].name).toContain('Prusament');
      expect(results[0].name).toContain('PLA');
    });

    it('should prefer brand matches in global search', () => {
      // When searching without brand filter, brands should rank higher
      const results = search(mockIndex, 'bambu', {});
      const brandResult = results.find((r) => r.type === 'brand' && r.slug === 'bambulab');
      const materialResult = results.find((r) => r.type === 'material' && r.brandSlug === 'bambulab');

      expect(brandResult).toBeDefined();
      expect(materialResult).toBeDefined();
      expect(results.indexOf(brandResult!)).toBeLessThan(results.indexOf(materialResult!));
    });

    it('should prefer material name matches when brand filter is active', () => {
      const filters: SearchFilters = { brand: 'prusament' };
      const results = search(mockIndex, 'orange', filters);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Orange');
    });

    it('should handle special characters gracefully', () => {
      const indexWithSpecial: SearchResult[] = [
        { type: 'material', slug: 'test', name: 'PLA+ Pro (Enhanced)', score: 0 },
      ];
      const results = search(indexWithSpecial, 'pla+ pro', {});
      expect(results.length).toBeGreaterThan(0);
    });

    it('should match materialType field', () => {
      const filters: SearchFilters = { types: ['material'] };
      const results = search(mockIndex, 'PETG', filters);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.materialType === 'PETG')).toBe(true);
    });

    it('should return results sorted by score descending', () => {
      const results = search(mockIndex, 'pla', {});
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('should exclude items not matching brand filter', () => {
      const filters: SearchFilters = { brand: 'bambulab' };
      const results = search(mockIndex, 'pla', filters);
      // Should only find Bambu materials, not Prusament
      const prusamentResults = results.filter((r) => r.brandSlug === 'prusament');
      expect(prusamentResults).toHaveLength(0);
    });
  });

  describe('tokenize', () => {
    it('should split on spaces, hyphens, and underscores', () => {
      const results = search(
        [{ type: 'material', slug: 'test', name: 'PLA-Black_v2 Edition', score: 0 }],
        'pla black v2',
        {},
      );
      expect(results.length).toBeGreaterThan(0);
    });

    it('should be case insensitive', () => {
      const results = search(
        [{ type: 'material', slug: 'test', name: 'Galaxy Black', score: 0 }],
        'GALAXY BLACK',
        {},
      );
      expect(results.length).toBeGreaterThan(0);
    });

    it('should normalize accented characters', () => {
      const indexWithAccents: SearchResult[] = [
        { type: 'material', slug: 'cafe', name: 'Café Latte Brown', score: 0 },
      ];
      const results = search(indexWithAccents, 'cafe latte', {});
      expect(results.length).toBeGreaterThan(0);
    });

    it('should match Czech diacritics both ways', () => {
      const indexWithCzech: SearchResult[] = [
        { type: 'material', slug: 'zluta', name: 'Žlutá', score: 0 },
      ];
      // Search without diacritics should match
      expect(search(indexWithCzech, 'zluta', {})).toHaveLength(1);
      // Search with diacritics should also match
      expect(search(indexWithCzech, 'žlutá', {})).toHaveLength(1);
    });

    it('should handle mixed separators', () => {
      const results = search(
        [{ type: 'material', slug: 'test', name: 'Galaxy-Black_Edition Pro', score: 0 }],
        'galaxy black edition pro',
        {},
      );
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty index', () => {
      const results = search([], 'test', {});
      expect(results).toHaveLength(0);
    });

    it('should handle very long query', () => {
      const longQuery = 'a '.repeat(100);
      const mockIndex: SearchResult[] = [
        { type: 'brand', slug: 'test', name: 'Test Brand', score: 0 },
      ];
      // Should not throw
      expect(() => search(mockIndex, longQuery, {})).not.toThrow();
    });

    it('should handle items with empty names', () => {
      const indexWithEmpty: SearchResult[] = [
        { type: 'brand', slug: 'empty', name: '', score: 0 },
        { type: 'brand', slug: 'valid', name: 'Valid Brand', score: 0 },
      ];
      const results = search(indexWithEmpty, 'valid', {});
      expect(results.length).toBe(1);
      expect(results[0].slug).toBe('valid');
    });

    it('should handle type filter with no matching items', () => {
      const filters: SearchFilters = { types: ['package'] };
      const mockIndex: SearchResult[] = [
        { type: 'brand', slug: 'test', name: 'Test', score: 0 },
      ];
      const results = search(mockIndex, 'test', filters);
      expect(results).toHaveLength(0);
    });

    it('should handle brand filter for non-existent brand', () => {
      const filters: SearchFilters = { brand: 'nonexistent' };
      const mockIndex: SearchResult[] = [
        { type: 'material', slug: 'mat', name: 'Material', brandSlug: 'other', score: 0 },
      ];
      const results = search(mockIndex, 'material', filters);
      expect(results).toHaveLength(0);
    });
  });

  describe('package support', () => {
    const mockIndexWithPackages: SearchResult[] = [
      { type: 'brand', slug: 'prusament', name: 'Prusament', score: 0 },
      {
        type: 'package',
        slug: 'prusament-pla-pack',
        name: 'Prusament PLA Starter Pack',
        brandSlug: 'prusament',
        brandName: 'Prusament',
        score: 0,
      },
      {
        type: 'package',
        slug: 'rainbow-pack',
        name: 'Rainbow Color Pack',
        brandSlug: 'prusament',
        brandName: 'Prusament',
        score: 0,
      },
    ];

    it('should find packages by name', () => {
      const results = search(mockIndexWithPackages, 'starter pack', {});
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].type).toBe('package');
    });

    it('should filter to only packages', () => {
      const filters: SearchFilters = { types: ['package'] };
      const results = search(mockIndexWithPackages, 'pack', filters);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.type === 'package')).toBe(true);
    });

    it('should filter packages by brand', () => {
      const filters: SearchFilters = { types: ['package'], brand: 'prusament' };
      const results = search(mockIndexWithPackages, 'pack', filters);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.brandSlug === 'prusament')).toBe(true);
    });
  });
});
