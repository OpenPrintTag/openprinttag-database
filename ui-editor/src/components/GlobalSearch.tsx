import { useMatch, useNavigate } from '@tanstack/react-router';
import {
  Building2,
  ChevronDown,
  Command,
  Loader2,
  Package,
  Palette,
  Search,
  X,
} from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  SearchFilters,
  SearchResponse,
  SearchResult,
  SearchResultType,
} from '~/routes/api/search';
import { getOS } from '~/utils/os';

const TYPE_ICONS: Record<SearchResultType, React.ReactNode> = {
  brand: <Building2 className="h-4 w-4" />,
  material: <Palette className="h-4 w-4" />,
  package: <Package className="h-4 w-4" />,
  container: <Package className="h-4 w-4" />,
};

const TYPE_ICONS_SMALL: Record<SearchResultType, React.ReactNode> = {
  brand: <Building2 className="h-3 w-3" />,
  material: <Palette className="h-3 w-3" />,
  package: <Package className="h-3 w-3" />,
  container: <Package className="h-3 w-3" />,
};

const TYPE_LABELS: Record<SearchResultType, string> = {
  brand: 'Brand',
  material: 'Material',
  package: 'Package',
  container: 'Container',
};

const TYPE_COLORS: Record<SearchResultType, string> = {
  brand: 'hsl(var(--primary))',
  material: 'hsl(142 76% 36%)',
  package: 'hsl(38 92% 50%)',
  container: 'hsl(280 67% 50%)',
};

type BrandOption = {
  slug: string;
  name: string;
};

type GlobalSearchProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [timing, setTiming] = useState<number | null>(null);
  const match = useMatch({ from: '/brands/$brandId', shouldThrow: false });

  // Brand filter state
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [brandDropdownIndex, setBrandDropdownIndex] = useState(0);
  const [typeDropdownIndex, setTypeDropdownIndex] = useState(0);
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const brandInputRef = useRef<HTMLInputElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load brands for filter dropdown
  useEffect(() => {
    if (isOpen && brands.length === 0) {
      setBrandsLoading(true);
      fetch('/api/brands/basic')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const sorted = data
              .map((b: any) => ({ slug: b.slug, name: b.name }))
              .sort((a: BrandOption, b: BrandOption) =>
                a.name.localeCompare(b.name),
              );
            setBrands(sorted);
          }
        })
        .catch(console.error)
        .finally(() => setBrandsLoading(false));
    }
  }, [isOpen, brands.length]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        brandDropdownRef.current &&
        !brandDropdownRef.current.contains(e.target as Node)
      ) {
        setShowBrandDropdown(false);
      }
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(e.target as Node)
      ) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      if (match?.params?.brandId) {
        setFilters((prev) => ({ ...prev, brand: match.params.brandId }));
      } else {
        setFilters({});
      }
    }
  }, [isOpen]);

  // Use ref to always have current filters in async callback
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTiming(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const currentFilters = filtersRef.current;
      try {
        const params = new URLSearchParams({ q: query, limit: '30' });
        if (currentFilters.types?.length) {
          params.set('types', currentFilters.types.join(','));
        }
        if (currentFilters.brand) {
          params.set('brand', currentFilters.brand);
        }
        const res = await fetch(`/api/search?${params}`);
        const data: SearchResponse = await res.json();
        setResults(data.results || []);
        setTiming(data.timing);
        setSelectedIndex(0);
      } catch (e) {
        console.error('Search failed:', e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, filters]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedEl = resultsRef.current.querySelector(
        `[data-index="${selectedIndex}"]`,
      );
      selectedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, results.length]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onClose();
      switch (result.type) {
        case 'brand':
          navigate({
            to: '/brands/$brandId',
            params: { brandId: result.slug },
          });
          break;
        case 'material':
          if (result.brandSlug) {
            navigate({
              to: '/brands/$brandId/materials/$materialId',
              params: { brandId: result.brandSlug, materialId: result.slug },
            });
          }
          break;
        case 'package':
          if (result.brandSlug) {
            navigate({
              to: '/brands/$brandId/packages/$packageId',
              params: { brandId: result.brandSlug, packageId: result.slug },
            });
          }
          break;
        case 'container':
          navigate({
            to: '/containers/$containerId',
            params: { containerId: result.slug },
          });
          break;
      }
    },
    [navigate, onClose],
  );

  const typeOptions: SearchResultType[] = [
    'brand',
    'material',
    'package',
    'container',
  ];

  const filteredBrands = brandSearch
    ? brands.filter(
        (b) =>
          b.name.toLowerCase().includes(brandSearch.toLowerCase()) ||
          b.slug.toLowerCase().includes(brandSearch.toLowerCase()),
      )
    : brands;

  const selectedBrandName = filters.brand
    ? brands.find((b) => b.slug === filters.brand)?.name
    : null;

  const hasFilters = (filters.types?.length ?? 0) > 0 || !!filters.brand;

  const toggleTypeFilter = useCallback((type: SearchResultType) => {
    setFilters((prev) => {
      const current = prev.types || [];
      const newTypes = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      return { ...prev, types: newTypes.length ? newTypes : undefined };
    });
    setShowTypeDropdown(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const selectBrand = useCallback((brandSlug: string | undefined) => {
    setFilters((prev) => ({ ...prev, brand: brandSlug }));
    setShowBrandDropdown(false);
    setBrandSearch('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const removeTypeFilter = useCallback((type: SearchResultType) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types?.filter((t) => t !== type),
    }));
  }, []);

  const removeBrandFilter = useCallback(() => {
    setFilters((prev) => ({ ...prev, brand: undefined }));
  }, []);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Backspace removes last filter when input is empty
      if (
        e.key === 'Backspace' &&
        !query &&
        (filters.types?.length || filters.brand)
      ) {
        e.preventDefault();
        if (filters.brand) {
          setFilters((prev) => ({ ...prev, brand: undefined }));
        } else if (filters.types?.length) {
          setFilters((prev) => ({
            ...prev,
            types: prev.types?.slice(0, -1),
          }));
        }
      }
    },
    [query, filters],
  );

  const handleBrandDropdownKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setBrandDropdownIndex((i) =>
            Math.min(i + 1, filteredBrands.length - 1),
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setBrandDropdownIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredBrands[brandDropdownIndex]) {
            selectBrand(filteredBrands[brandDropdownIndex].slug);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowBrandDropdown(false);
          inputRef.current?.focus();
          break;
      }
    },
    [filteredBrands, brandDropdownIndex, selectBrand],
  );

  const handleTypeDropdownKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setTypeDropdownIndex((i) => Math.min(i + 1, typeOptions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setTypeDropdownIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          toggleTypeFilter(typeOptions[typeDropdownIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          setShowTypeDropdown(false);
          inputRef.current?.focus();
          break;
      }
    },
    [typeDropdownIndex, toggleTypeFilter, typeOptions],
  );

  // Global keyboard handler for the modal
  const handleModalKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Let dropdowns handle their own navigation
      if (showBrandDropdown || showTypeDropdown) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setShowBrandDropdown(false);
          setShowTypeDropdown(false);
          inputRef.current?.focus();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          if (results[selectedIndex]) {
            e.preventDefault();
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [
      results,
      selectedIndex,
      handleSelect,
      onClose,
      showBrandDropdown,
      showTypeDropdown,
    ],
  );

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleModalKeyDown}
    >
      <div
        className="w-full max-w-2xl rounded-xl border shadow-2xl"
        style={{
          backgroundColor: 'hsl(var(--card))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        {/* Search Input with Filter Chips */}
        <div
          className="flex flex-wrap items-center gap-2 border-b px-4 py-3"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <Search
            className="h-5 w-5 shrink-0"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          />

          {/* Active Filter Chips */}
          {filters.types?.map((type) => (
            <span
              key={type}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
              style={{
                backgroundColor: TYPE_COLORS[type],
                color: 'white',
              }}
            >
              in:{TYPE_LABELS[type].toLowerCase()}
              <button
                onClick={() => removeTypeFilter(type)}
                className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {filters.brand && selectedBrandName && (
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
              style={{
                backgroundColor: 'hsl(var(--primary))',
                color: 'white',
              }}
            >
              brand:{selectedBrandName.toLowerCase().replace(/\s+/g, '-')}
              <button
                onClick={removeBrandFilter}
                className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <input
            ref={inputRef}
            type="text"
            className="min-w-[120px] flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
            style={{ color: 'hsl(var(--foreground))' }}
            placeholder={
              hasFilters
                ? 'Type to search...'
                : 'Search brands, materials, packages...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
          />

          {loading && (
            <Loader2
              className="h-5 w-5 shrink-0 animate-spin"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            />
          )}
          <button
            onClick={onClose}
            className="shrink-0 rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X
              className="h-5 w-5"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            />
          </button>
        </div>

        {/* Filter Buttons Row */}
        <div
          className="relative flex items-center gap-2 overflow-visible border-b px-4 py-2"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <span
            className="text-xs"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            Add filter:
          </span>

          {/* Brand Filter Dropdown */}
          <div className="relative" ref={brandDropdownRef}>
            <button
              onClick={() => {
                setShowBrandDropdown(!showBrandDropdown);
                setShowTypeDropdown(false);
                setBrandDropdownIndex(0);
                setBrandSearch('');
              }}
              className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-all hover:border-gray-400"
              style={{
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              <Building2 className="h-3 w-3" />
              brand:
              <ChevronDown className="h-3 w-3" />
            </button>

            {showBrandDropdown && (
              <div
                className="absolute top-full left-0 z-[150] mt-1 w-64 overflow-hidden rounded-lg border shadow-lg"
                style={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                }}
              >
                <div
                  className="border-b px-3 py-2"
                  style={{ borderColor: 'hsl(var(--border))' }}
                >
                  <input
                    ref={brandInputRef}
                    type="text"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                    style={{ color: 'hsl(var(--foreground))' }}
                    placeholder="Filter brands..."
                    value={brandSearch}
                    onChange={(e) => {
                      setBrandSearch(e.target.value);
                      setBrandDropdownIndex(0);
                    }}
                    onKeyDown={handleBrandDropdownKeyDown}
                    autoFocus
                  />
                </div>

                <div
                  className="max-h-48 overflow-y-auto"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {brandsLoading && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                      />
                    </div>
                  )}

                  {!brandsLoading &&
                    filteredBrands.map((brand, index) => {
                      const isHighlighted = index === brandDropdownIndex;
                      const isSelected = filters.brand === brand.slug;
                      let bgColor = 'transparent';
                      if (isHighlighted) bgColor = 'hsl(var(--muted))';
                      else if (isSelected) bgColor = 'hsl(var(--accent))';

                      return (
                        <button
                          key={brand.slug}
                          onClick={() => selectBrand(brand.slug)}
                          onMouseEnter={() => setBrandDropdownIndex(index)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                          style={{ backgroundColor: bgColor }}
                        >
                          <span
                            className="truncate"
                            style={{ color: 'hsl(var(--foreground))' }}
                          >
                            {brand.name}
                          </span>
                          <span
                            className="ml-auto text-xs"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                          >
                            brand:{brand.slug}
                          </span>
                        </button>
                      );
                    })}

                  {!brandsLoading && filteredBrands.length === 0 && (
                    <div
                      className="px-3 py-4 text-center text-sm"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      No brands found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Type Filter Dropdown */}
          <div className="relative" ref={typeDropdownRef}>
            <button
              onClick={() => {
                setShowTypeDropdown(!showTypeDropdown);
                setShowBrandDropdown(false);
                setTypeDropdownIndex(0);
              }}
              className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-all hover:border-gray-400"
              style={{
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              <Palette className="h-3 w-3" />
              in:
              <ChevronDown className="h-3 w-3" />
            </button>

            {showTypeDropdown && (
              <div
                className="absolute top-full left-0 z-[150] mt-1 w-48 overflow-hidden rounded-lg border shadow-lg"
                style={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                }}
                onKeyDown={handleTypeDropdownKeyDown}
                tabIndex={-1}
                ref={(el) => el?.focus()}
              >
                {typeOptions.map((type, index) => {
                  const isActive = filters.types?.includes(type);
                  const isHighlighted = index === typeDropdownIndex;
                  return (
                    <button
                      key={type}
                      onClick={() => toggleTypeFilter(type)}
                      onMouseEnter={() => setTypeDropdownIndex(index)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                      style={{
                        backgroundColor: isHighlighted
                          ? 'hsl(var(--muted))'
                          : 'transparent',
                      }}
                    >
                      <span style={{ color: TYPE_COLORS[type] }}>
                        {TYPE_ICONS_SMALL[type]}
                      </span>
                      <span style={{ color: 'hsl(var(--foreground))' }}>
                        in:{TYPE_LABELS[type].toLowerCase()}
                      </span>
                      {isActive && (
                        <span
                          className="ml-auto text-xs"
                          style={{ color: 'hsl(var(--primary))' }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clear all filters */}
          {hasFilters && (
            <button
              onClick={() => setFilters({})}
              className="ml-auto flex items-center gap-1 text-xs transition-colors hover:underline"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Results */}
        <div
          ref={resultsRef}
          role="listbox"
          aria-label="Search results"
          aria-activedescendant={
            results.length > 0 ? `result-${selectedIndex}` : undefined
          }
          className="max-h-[400px] overflow-y-auto"
          style={{ scrollbarWidth: 'thin' }}
        >
          {results.length === 0 && query.trim() && !loading && (
            <div
              className="px-4 py-8 text-center text-sm"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              No results found for "{query}"
              {hasFilters && ' with current filters'}
            </div>
          )}

          {results.length === 0 && !query.trim() && (
            <div
              className="px-4 py-8 text-center"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              <div className="mb-2 text-sm">Start typing to search...</div>
              <div className="text-xs opacity-75">
                Tip: Use Backspace to remove filters
              </div>
            </div>
          )}

          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.slug}`}
              id={`result-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              data-index={index}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
              style={{
                backgroundColor:
                  index === selectedIndex ? 'hsl(var(--muted))' : 'transparent',
              }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: TYPE_COLORS[result.type],
                  color: 'white',
                }}
              >
                {TYPE_ICONS[result.type]}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate font-medium"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  {result.name}
                </div>
                <div
                  className="flex items-center gap-2 truncate text-xs"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  <span>{TYPE_LABELS[result.type]}</span>
                  {result.brandName && (
                    <>
                      <span>•</span>
                      <span>{result.brandName}</span>
                    </>
                  )}
                  {result.materialType && (
                    <>
                      <span>•</span>
                      <span>{result.materialType}</span>
                    </>
                  )}
                </div>
              </div>
              {result.color && (
                <div
                  className="h-6 w-6 shrink-0 rounded-full border"
                  style={{
                    backgroundColor: result.color,
                    borderColor: 'hsl(var(--border))',
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between border-t px-4 py-2 text-xs"
          style={{
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded border px-1.5 py-0.5 font-mono text-[10px]">
                ↑↓
              </kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border px-1.5 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>
              <span>select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border px-1.5 py-0.5 font-mono text-[10px]">
                ⌫
              </kbd>
              <span>remove filter</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border px-1.5 py-0.5 font-mono text-[10px]">
                esc
              </kbd>
              <span>close</span>
            </span>
          </div>
          {timing !== null && (
            <span>
              {results.length} results in {timing}ms
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function GlobalSearchTrigger({ onClick }: { onClick: () => void }) {
  const isMac = getOS() === 'MacOS';

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all hover:border-gray-400"
      style={{
        backgroundColor: 'hsl(var(--muted))',
        borderColor: 'hsl(var(--border))',
        color: 'hsl(var(--muted-foreground))',
      }}
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search...</span>
      <kbd
        className="ml-2 hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline-flex"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        {isMac ? (
          <>
            <Command className="mr-0.5 inline h-3 w-3" />K
          </>
        ) : (
          'CTRL+K'
        )}
      </kbd>
    </button>
  );
}

export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
