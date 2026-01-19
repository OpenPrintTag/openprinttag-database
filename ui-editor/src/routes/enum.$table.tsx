import { createFileRoute, Link } from '@tanstack/react-router';
import { capitalCase } from 'change-case';
import { ChevronRight, Database, Loader2, Search } from 'lucide-react';
import React from 'react';

import { SearchBar } from '~/components/SearchBar';
import { StateDisplay } from '~/components/StateDisplay';
import { Badge } from '~/components/ui';
import { useApi } from '~/hooks/useApi';

type TableResponse = { items: any[]; meta: { key: string } };

export const formatEnumLabel = (s: string): string => {
  if (!s) return s;
  return capitalCase(s);
};

export const Route = createFileRoute('/enum/$table')({
  component: EnumTableList,
});

function EnumTableList() {
  const { table } = Route.useParams();

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
      const nameA = String(a?.name ?? a?.key ?? a?.id ?? '');
      const nameB = String(b?.name ?? b?.key ?? b?.id ?? '');
      return nameA.localeCompare(nameB);
    });

    return result;
  }, [items, debouncedSearch]);

  const tableLabel = formatEnumLabel(table);

  return (
    <div className="w-full space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link
          to="/enum"
          resetScroll={false}
          className="flex items-center gap-1 transition-colors hover:text-purple-600"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          <span>All Tables</span>
        </Link>
      </div>

      {/* Header Section */}
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">{tableLabel}</h1>
          <p className="text-gray-600">
            Browse {items.length} items in this lookup table
          </p>
        </div>
      </div>

      {/* Background Loading Indicator */}
      {loading && data && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Updating items...</span>
        </div>
      )}

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={`Search ${tableLabel.toLowerCase()}...`}
      />

      {/* Results Info */}
      {debouncedSearch && (
        <div className="text-sm text-gray-600">
          Found <span className="font-semibold">{processedItems.length}</span>{' '}
          of <span className="font-semibold">{items.length}</span> items
        </div>
      )}

      <StateDisplay error={error} loading={loading} />

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
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-sm text-purple-600 hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

      {/* Items Grid */}
      {!loading && !error && processedItems.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {processedItems
            .sort((a, b) => a.key - b.key)
            .map((it, idx) => {
              const itemId = String(
                it?.key ?? it?.code ?? it?.id ?? it?.abbreviation ?? idx,
              );
              const name = String(it?.display_name ?? it?.name ?? itemId);

              return (
                <div
                  key={itemId}
                  className="group flex w-full flex-col justify-between gap-2 rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-all"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {name}
                      <span className="ml-1 text-xs text-gray-500">
                        ({itemId})
                      </span>
                    </div>
                    {it?.abbreviation && (
                      <div className="text-sm">{String(it.abbreviation)}</div>
                    )}
                  </div>
                  {it?.description && (
                    <div className="text-xs wrap-break-word text-gray-500">
                      {String(it.description)}
                    </div>
                  )}
                  {it?.category && (
                    <div>
                      <Badge variant="outline">{String(it.category)}</Badge>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
