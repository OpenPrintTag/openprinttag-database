import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChevronRight, Loader2, Package2, Plus, Search } from 'lucide-react';
import React from 'react';

import { ContainerSheet } from '~/components/container-sheet';
import { PageHeader } from '~/components/PageHeader';
import { SearchBar } from '~/components/SearchBar';
import { Button } from '~/components/ui';
import { useEnum } from '~/hooks/useEnum';
import type { Brand } from '~/types/brand';
import { slugifyName } from '~/utils/slug';

type Container = Record<string, unknown>;

export const Route = createFileRoute('/containers/')({
  component: RouteComponent,
  validateSearch: (
    search: Record<string, unknown>,
  ): { containerId?: string; mode?: string } => {
    return {
      containerId: search.containerId as string | undefined,
      mode: search.mode as string | undefined,
    };
  },
});

function RouteComponent() {
  const {
    data: containersData,
    loading: containersLoading,
    error: containersError,
  } = useEnum('containers');
  const { data: brandsData } = useEnum('brands', { variant: 'basic' });

  const containers = (containersData?.items as Container[]) ?? [];
  const brands = (brandsData?.items as Brand[]) ?? [];
  const loading = containersLoading;
  const error = containersError;
  const { containerId, mode } = Route.useSearch();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  let containerMode: 'create' | 'edit' | 'view' | null = null;
  if (mode === 'create') {
    containerMode = 'create';
  } else if (mode === 'edit') {
    containerMode = 'edit';
  } else if (containerId) {
    containerMode = 'view';
  }

  const handleOpenContainerSheet = (
    sheetMode: 'create' | 'edit' | 'view',
    id?: string,
  ) => {
    let search: { mode?: string; containerId?: string } = {};
    if (sheetMode === 'create') {
      search = { mode: 'create' };
    } else if (sheetMode === 'edit') {
      search = { containerId: id, mode: 'edit' };
    } else {
      search = { containerId: id };
    }

    navigate({
      to: '/containers',
      search,
      replace: true,
      resetScroll: false,
    });
  };

  // Create a map of brand_slug to brand name for quick lookup
  const brandMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    brands.forEach((brand) => {
      if (brand.slug) {
        map[brand.slug] = brand.name;
      }
    });
    return map;
  }, [brands]);

  // Debounce search
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  // Filter containers
  const processedContainers = React.useMemo(() => {
    let result = [...containers];

    // Filter by search query
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter((container) => {
        const name = String(container.name ?? '').toLowerCase();
        const slug = String(container.slug ?? '').toLowerCase();
        const description = String(container.description ?? '').toLowerCase();
        const id = String((container as any).id ?? '').toLowerCase();
        return (
          name.includes(query) ||
          slug.includes(query) ||
          description.includes(query) ||
          id.includes(query)
        );
      });
    }

    // Sort by name A-Z
    result.sort((a, b) => {
      const nameA = String(a.name ?? '');
      const nameB = String(b.name ?? '');
      return nameA.localeCompare(nameB);
    });

    return result;
  }, [containers, debouncedSearch]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      {/* Header Section */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Material Containers"
          description={`Browse and manage ${containers.length} material containers in the database`}
        />
        <button
          onClick={() => handleOpenContainerSheet('create')}
          className="btn flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Container
        </button>
      </div>

      {/* Background Loading Indicator - shown when refreshing with existing data */}
      {loading && containers.length > 0 && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Updating containers...</span>
        </div>
      )}

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search containers by name, slug, or description..."
      />

      {/* Results Info */}
      {debouncedSearch && (
        <div className="text-sm text-gray-600">
          Found{' '}
          <span className="font-semibold">{processedContainers.length}</span> of{' '}
          <span className="font-semibold">{containers.length}</span> containers
        </div>
      )}

      {/* Loading State */}
      {loading && containers.length === 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="relative h-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
            >
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && containers.length === 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <div className="text-sm font-medium text-red-900">
            Error loading containers
          </div>
          <div className="mt-1 text-xs text-red-700">{error}</div>
        </div>
      )}

      {/* Empty State - No Containers */}
      {!loading && !error && containers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
            <Package2 className="h-10 w-10 text-gray-500" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            No containers found
          </h3>
          <p className="text-sm text-gray-600">
            There are no material containers in the database yet.
          </p>
        </div>
      )}

      {/* Empty State - No Search Results */}
      {!loading &&
        !error &&
        containers.length > 0 &&
        processedContainers.length === 0 &&
        debouncedSearch && (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
              <Search className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              No results found
            </h3>
            <p className="text-sm text-gray-600">
              No containers matching &ldquo;{debouncedSearch}&rdquo;. Try a
              different search term.
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery('')}
              className="mt-4 cursor-pointer"
            >
              Clear search
            </Button>
          </div>
        )}

      {/* Containers Grid */}
      {!loading && !error && processedContainers.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {processedContainers.map((container) => {
            const id =
              (container.slug as string) ||
              (container.uuid as string) ||
              String((container as any).id ?? '') ||
              slugifyName(String(container.name ?? '')) ||
              '';
            const name = String(container.name ?? id);
            const brandSlug = container.brand_slug as string | undefined;
            const brandName = brandSlug ? brandMap[brandSlug] : undefined;

            return (
              <button
                key={String(id)}
                onClick={() => handleOpenContainerSheet('view', String(id))}
                className="group block w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex-1 text-sm font-semibold text-gray-900 group-hover:text-orange-600">
                    {name}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-600" />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {brandName && (
                    <div className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      {brandName}
                    </div>
                  )}
                  {(container as any).capacity && (
                    <div className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      Capacity: {String((container as any).capacity)}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Container Sheet */}
      <ContainerSheet
        open={!!containerMode}
        onOpenChange={(open) => {
          if (!open) {
            navigate({
              to: '/containers',
              search: {},
              replace: true,
              resetScroll: false,
            });
          }
        }}
        container={
          (containerMode === 'view' || containerMode === 'edit') && containerId
            ? containers.find(
                (c) =>
                  c.slug === containerId ||
                  c.uuid === containerId ||
                  slugifyName(String(c.name ?? '')) === containerId,
              )
            : undefined
        }
        mode={containerMode === 'create' ? 'create' : 'edit'}
        onSuccess={() => {
          // Refetch is automatic via React Query invalidation
          if (containerMode === 'create') {
            navigate({
              to: '/containers',
              search: {},
              replace: true,
            });
          }
        }}
        readOnly={containerMode === 'view'}
        onEdit={() => {
          // Switch to edit mode - keep the same container open
          handleOpenContainerSheet('edit', containerId);
        }}
      />
    </div>
  );
}
