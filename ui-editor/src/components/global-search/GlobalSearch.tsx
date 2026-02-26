import { useMatch, useNavigate } from '@tanstack/react-router';
import { Loader2, Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  SearchFilters,
  SearchResponse,
  SearchResult,
} from '~/routes/api/search';

import { SearchErrorBoundary } from './SearchErrorBoundary';
import { SearchFilterBar } from './SearchFilters';
import { SearchResultItem } from './SearchResultItem';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [timing, setTiming] = useState<number | null>(null);
  const match = useMatch({ from: '/brands/$brandId', shouldThrow: false });

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  const hasFilters = (filters.types?.length ?? 0) > 0 || !!filters.brand;

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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

  const handleModalKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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
    [results, selectedIndex, handleSelect, onClose],
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
        <SearchFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          inputRef={inputRef}
          renderChips={(chips) => (
            <div
              className="flex flex-wrap items-center gap-2 border-b px-4 py-3"
              style={{ borderColor: 'hsl(var(--border))' }}
            >
              <Search
                className="h-5 w-5 shrink-0"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              />

              {chips}

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
          )}
        />

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
              No results found for &quot;{query}&quot;
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

          <SearchErrorBoundary>
            {results.map((result, index) => (
              <SearchResultItem
                key={`${result.type}-${result.slug}`}
                result={result}
                index={index}
                isSelected={index === selectedIndex}
                onSelect={handleSelect}
                onHover={setSelectedIndex}
              />
            ))}
          </SearchErrorBoundary>
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
