import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package2,
  Pencil,
  Search,
  X,
} from 'lucide-react';
import React from 'react';

import { DataGrid } from '~/components/DataGrid';
import { FieldEditor } from '~/components/SchemaFields';
import { Button, Sheet, SheetContent } from '~/components/ui';
import { useApi } from '~/hooks/useApi';
import { useUpdateContainer } from '~/hooks/useMutations';
import { useSchema } from '~/hooks/useSchema';
import type { Brand } from '~/types/brand';
import { slugifyName } from '~/utils/slug';

type Container = Record<string, unknown>;

export const Route = createFileRoute('/containers/')({
  component: RouteComponent,
  validateSearch: (
    search: Record<string, unknown>,
  ): { containerId?: string } => {
    return {
      containerId: search.containerId as string | undefined,
    };
  },
});

function RouteComponent() {
  const { data, error, loading } = useApi<Container[]>('/api/containers');
  const containers = data ?? [];
  const { data: brandsData } = useApi<Brand[]>('/api/brands');
  const brands = brandsData ?? [];
  const { containerId } = Route.useSearch();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

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
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Material Containers
        </h1>
        <p className="text-gray-600">
          Browse and manage {containers.length} material containers in the
          database
        </p>
      </div>

      {/* Background Loading Indicator - shown when refreshing with existing data */}
      {loading && data && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Updating containers...</span>
        </div>
      )}

      {/* Search Bar */}
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
          placeholder="Search containers by name, slug, or description..."
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

      {/* Results Info */}
      {debouncedSearch && (
        <div className="text-sm text-gray-600">
          Found{' '}
          <span className="font-semibold">{processedContainers.length}</span> of{' '}
          <span className="font-semibold">{containers.length}</span> containers
        </div>
      )}

      {/* Loading State */}
      {loading && (
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
      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <div className="text-sm font-medium text-red-900">
            Error loading containers
          </div>
          <div className="mt-1 text-xs text-red-700">{error}</div>
        </div>
      )}

      {/* Empty State - No Containers */}
      {!loading && !error && data && containers.length === 0 && (
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
        data &&
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
                onClick={() => {
                  navigate({
                    to: '/containers',
                    search: { containerId: String(id) },
                  });
                }}
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

      {/* Container Detail Sheet */}
      <Sheet
        open={!!containerId}
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
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {containerId ? <ContainerDetail containerId={containerId} /> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Container Detail Component
function ContainerDetail({ containerId }: { containerId: string }) {
  const { data, error, loading } = useApi<Container>(
    () => `/api/containers/${containerId}`,
    undefined,
    [containerId],
  );
  const schema = useSchema();
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState<any | null>(null);

  const updateContainerMutation = useUpdateContainer(containerId);

  const brandSlug = data?.brand_slug as string | undefined;
  const { data: brandData } = useApi<Brand>(
    brandSlug ? () => `/api/brands/${brandSlug}` : '',
    undefined,
    [brandSlug],
  );

  React.useEffect(() => {
    if (data && !editing) setForm(data);
  }, [data, editing]);

  const fields = React.useMemo(() => {
    if (!schema || typeof schema !== 'object') return null;
    const ent = (schema.entities ?? {}).material_containers;
    return ent?.fields ?? null;
  }, [schema]);

  if (loading && !data)
    return <div className="text-gray-600">Loading container…</div>;
  if (error) return <div className="text-red-700">Error: {error}</div>;
  if (!data) return null;

  const title = String(data?.name ?? data?.slug ?? containerId);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link
          to="/containers"
          className="flex items-center gap-1 transition-colors hover:text-blue-600"
        >
          <ChevronLeft className="h-4 w-4" />
          All Containers
        </Link>
        {brandSlug && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link
              to="/brands/$brandId"
              params={{ brandId: brandSlug }}
              className="flex items-center gap-1 transition-colors hover:text-orange-600"
            >
              {brandData?.name ?? brandSlug}
            </Link>
          </>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="text-2xl font-bold tracking-tight">{title}</h4>
          {data.slug ? (
            <div className="text-sm text-gray-500">{String(data.slug)}</div>
          ) : null}
          {brandSlug && (
            <div className="mt-2">
              <span className="text-sm text-gray-500">Brand: </span>
              <Link
                to="/brands/$brandId"
                params={{ brandId: brandSlug }}
                className="text-sm font-medium text-orange-600 transition-colors hover:text-orange-700 hover:underline"
              >
                {brandData?.name ?? brandSlug}
              </Link>
            </div>
          )}
        </div>
        {fields && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(!editing)}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Pencil className="h-4 w-4" />
              {editing ? 'Cancel' : 'Edit Container'}
            </button>
          </div>
        )}
      </div>

      {/* Container Details */}
      {editing && fields ? (
        <div className="card">
          <div className="card-header">Edit Container</div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.entries(fields).map(([key, field]) => (
                <FieldEditor
                  key={key}
                  label={key}
                  field={field as any}
                  value={form?.[key]}
                  onChange={(val) =>
                    setForm((f: any) => ({ ...(f ?? {}), [key]: val }))
                  }
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                className="btn cursor-pointer"
                onClick={async () => {
                  try {
                    await updateContainerMutation.mutateAsync({ data: form });
                    setEditing(false);
                  } catch (err: any) {
                    alert(err?.message ?? 'Save failed');
                  }
                }}
                disabled={updateContainerMutation.isPending}
              >
                {updateContainerMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                className="btn-secondary cursor-pointer"
                onClick={() => {
                  setForm(data);
                  setEditing(false);
                }}
                disabled={updateContainerMutation.isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <DataGrid title="Container details" data={data} />
      )}
    </div>
  );
}
