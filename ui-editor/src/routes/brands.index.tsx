import { createFileRoute } from '@tanstack/react-router';
import { Building2, Search } from 'lucide-react';
import React from 'react';

import { BrandCard } from '~/components/BrandCard';
import { PageHeader } from '~/components/PageHeader';
import { SearchBar } from '~/components/SearchBar';
import { BrandCardGridSkeleton } from '~/components/skeletons';
import { useApi } from '~/hooks/useApi';
import type { Brand } from '~/types/brand';

export const Route = createFileRoute('/brands/')({
  component: RouteComponent,
});

function RouteComponent() {
  // Load brands without counts first (fast)
  const { data, error, loading } = useApi<Brand[]>('/api/brands/basic');
  const brands = data ?? [];
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  // Debounce search
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  // Filter brands
  const processedBrands = React.useMemo(() => {
    let result = [...brands];

    // Filter by search query
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

    // Sort by name A-Z
    result.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

    return result;
  }, [brands, debouncedSearch]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      {/* Header Section */}
      <PageHeader
        title="Material Brands"
        description={`Browse ${brands.length} material brands in the database.`}
      />

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search brands by name, slug, or keywords..."
      />
      {/* Results Info */}
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
      {/* Loading State */}
      {loading && !data && <BrandCardGridSkeleton count={12} />}
      {/* Error State */}
      {!loading && error && (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center shadow-md">
          <div className="text-base font-semibold text-red-900">
            Error loading brands
          </div>
          <div className="mt-2 text-sm text-red-700">{error}</div>
        </div>
      )}
      {/* Empty State - No Brands */}
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
      {/* Empty State - No Search Results */}
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
      {/* Brands Grid */}
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
