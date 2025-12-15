import { createFileRoute } from '@tanstack/react-router';
import { Building2, Search, X } from 'lucide-react';
import React from 'react';

import { BrandCard } from '~/components/BrandCard';
import { BrandCardGridSkeleton } from '~/components/skeletons';
import { useApi } from '~/hooks/useApi';
import type { Brand } from '~/types/brand';

export const Route = createFileRoute('/brands/')({
  component: RouteComponent,
});

const getBrandInitials = (name: string): string => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

type SortOption = 'name-asc' | 'name-desc' | 'materials-desc' | 'packages-desc';

function RouteComponent() {
  const { data, error, loading } = useApi<Brand[]>('/api/brands/basic');
  const brands = data ?? [];
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const processedBrands = React.useMemo(() => {
    let result = [...brands];

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter((brand) => {
        const name = String(brand.name ?? '').toLowerCase();
        const slug = String(brand.slug ?? '').toLowerCase();
        const keywords = Array.isArray(brand.keywords)
          ? brand.keywords.join(' ').toLowerCase()
          : '';
        return (
          name.includes(query) ||
          slug.includes(query) ||
          keywords.includes(query)
        );
      });
    }

    result.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

    return result;
  }, [brands, debouncedSearch]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-6">
      <div className="space-y-3">
        <h1
          className="text-4xl font-bold tracking-tight"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          Material Brands
        </h1>
        <p
          className="text-lg"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Browse and manage {brands.length} material brands in the database
        </p>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search
            className="h-5 w-5"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          />
        </div>
        <input
          type="text"
          className="w-full rounded-xl border py-3.5 pr-12 pl-12 text-base shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none"
          style={{
            backgroundColor: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            borderColor: 'hsl(var(--border))',
          }}
          placeholder="Search brands by name, slug, or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-full p-1.5 transition-all hover:scale-110"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            onClick={() => setSearchQuery('')}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      {debouncedSearch && (
        <div
          className="text-sm"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Found{' '}
          <span
            className="font-semibold"
            style={{ color: 'hsl(var(--primary))' }}
          >
            {processedBrands.length}
          </span>{' '}
          of{' '}
          <span
            className="font-semibold"
            style={{ color: 'hsl(var(--primary))' }}
          >
            {brands.length}
          </span>{' '}
          brands
        </div>
      )}
      {loading && !data && <BrandCardGridSkeleton count={12} />}
      {!loading && error && (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center shadow-md">
          <div className="text-base font-semibold text-red-900">
            Error loading brands
          </div>
          <div className="mt-2 text-sm text-red-700">{error}</div>
        </div>
      )}
      {!loading && !error && data && brands.length === 0 && (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 text-center shadow-sm"
          style={{
            borderColor: 'hsl(var(--border))',
            backgroundColor: 'hsl(var(--accent))',
          }}
        >
          <div
            className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full"
            style={{ backgroundColor: 'hsl(var(--muted))' }}
          >
            <Building2
              className="h-12 w-12"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            />
          </div>
          <h3
            className="mb-3 text-xl font-bold"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            No brands found
          </h3>
          <p
            className="text-base"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            There are no brands in the database yet.
          </p>
        </div>
      )}
      {!loading &&
        !error &&
        data &&
        brands.length > 0 &&
        processedBrands.length === 0 &&
        debouncedSearch && (
          <div
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 text-center shadow-sm"
            style={{
              borderColor: 'hsl(var(--border))',
              backgroundColor: 'hsl(var(--accent))',
            }}
          >
            <div
              className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full"
              style={{ backgroundColor: 'hsl(var(--muted))' }}
            >
              <Search
                className="h-12 w-12"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              />
            </div>
            <h3
              className="mb-3 text-xl font-bold"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              No results found
            </h3>
            <p
              className="mb-6 text-base"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              No brands matching &ldquo;{debouncedSearch}&rdquo;. Try a
              different search term.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="cursor-pointer rounded-xl border-2 px-6 py-3 text-base font-medium transition-all hover:scale-105"
              style={{
                borderColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary))',
                backgroundColor: 'hsl(var(--card))',
              }}
            >
              Clear search
            </button>
          </div>
        )}
      {!loading && !error && processedBrands.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {processedBrands.map((brand) => (
            <BrandCard key={brand.uuid || brand.slug} brand={brand} />
          ))}
        </div>
      )}
    </div>
  );
}
