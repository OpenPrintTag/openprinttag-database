import {
  createFileRoute,
  Link,
  Outlet,
  useMatches,
  useNavigate,
} from '@tanstack/react-router';
import { ChevronRight, Database, Loader2, Search, X } from 'lucide-react';
import React from 'react';

import { Button, Sheet, SheetContent } from '~/components/ui';
import { useApi } from '~/hooks/useApi';
import { formatEnumLabel } from '~/routes/enum.$table.$id';
import { slugifyName } from '~/utils/slug';

type TableResponse = { items: any[]; meta: { key: string } };

export const Route = createFileRoute('/enum/$table')({
  component: EnumTableList,
});

function EnumTableList() {
  const { table } = Route.useParams();
  const navigate = useNavigate();
  const matches = useMatches();

  // Check if there's an active child route (item detail)
  const hasChildRoute = matches.some((match) =>
    match.routeId.includes('/enum/$table/$id'),
  );
  const { data, error, loading } = useApi<TableResponse>(
    () => `/api/enum/${table}`,
    undefined,
    [table],
  );
  const items = data?.items ?? [];
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  // Debounce search
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  // Filter items
  const processedItems = React.useMemo(() => {
    let result = [...items];

    // Filter by search query
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter((it) => {
        const name = String(it?.name ?? '').toLowerCase();
        const code = String(it?.code ?? '').toLowerCase();
        const slug = String(it?.slug ?? '').toLowerCase();
        const uuid = String(it?.uuid ?? '').toLowerCase();
        const id = String(it?.id ?? '').toLowerCase();
        return (
          name.includes(query) ||
          code.includes(query) ||
          slug.includes(query) ||
          uuid.includes(query) ||
          id.includes(query)
        );
      });
    }

    // Sort by name A-Z
    result.sort((a, b) => {
      const nameA = String(a?.name ?? a?.slug ?? a?.id ?? '');
      const nameB = String(b?.name ?? b?.slug ?? b?.id ?? '');
      return nameA.localeCompare(nameB);
    });

    return result;
  }, [items, debouncedSearch]);

  const tableLabel = formatEnumLabel(table);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link
          to="/enum"
          className="flex items-center gap-1 transition-colors hover:text-purple-600"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          <span>All Tables</span>
        </Link>
      </div>

      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{tableLabel}</h1>
        <p className="text-gray-600">
          Browse and manage {items.length} items in this lookup table
        </p>
      </div>

      {/* Background Loading Indicator */}
      {loading && data && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Updating items...</span>
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
          placeholder={`Search ${tableLabel.toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 transition-all hover:scale-110"
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
          Found <span className="font-semibold">{processedItems.length}</span>{' '}
          of <span className="font-semibold">{items.length}</span> items
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            Error loading items
          </div>
          <div className="mt-1 text-xs text-red-700">{error}</div>
        </div>
      )}

      {/* Empty State - No Items */}
      {!loading && !error && data && items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
            <Database className="h-10 w-10 text-gray-500" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            No items found
          </h3>
          <p className="text-sm text-gray-600">
            There are no items in this table yet.
          </p>
        </div>
      )}

      {/* Empty State - No Search Results */}
      {!loading &&
        !error &&
        data &&
        items.length > 0 &&
        processedItems.length === 0 &&
        debouncedSearch && (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
              <Search className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              No results found
            </h3>
            <p className="text-sm text-gray-600">
              No items matching &ldquo;{debouncedSearch}&rdquo;. Try a different
              search term.
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery('')}
              className="mt-4"
            >
              Clear search
            </Button>
          </div>
        )}

      {/* Items Grid */}
      {!loading && !error && processedItems.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {processedItems.map((it, idx) => {
            const nameStr = String(it?.name ?? '');
            const itemId = String(
              it?.code ??
                it?.id ??
                it?.slug ??
                it?.uuid ??
                (slugifyName(nameStr) || idx),
            );
            const name = String(it?.name ?? it?.slug ?? itemId);
            const code = it?.code ? String(it.code) : null;

            return (
              <Link
                key={itemId}
                to="/enum/$table/$id"
                params={{ table, id: itemId }}
              >
                <button className="group block w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-orange-300 hover:shadow-md">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex-1 truncate text-sm font-semibold text-gray-900 group-hover:text-orange-600">
                      {name}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-600" />
                  </div>
                  {code && (
                    <div className="truncate text-xs text-gray-500">{code}</div>
                  )}
                  {it?.category && (
                    <div className="mt-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {String(it.category)}
                    </div>
                  )}
                </button>
              </Link>
            );
          })}
        </div>
      )}

      {/* Item Detail Sheet */}
      <Sheet
        open={hasChildRoute}
        onOpenChange={(open) => {
          if (!open) {
            navigate({ to: '/enum/$table', params: { table } });
          }
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <Outlet />
        </SheetContent>
      </Sheet>
    </div>
  );
}
