import { createFileRoute, Link } from '@tanstack/react-router';
import { capitalCase } from 'change-case';
import { ChevronRight, Database } from 'lucide-react';
import React from 'react';

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

  // Filter items
  const processedItems = React.useMemo(() => {
    const result = [...items];

    // Sort by name A-Z
    result.sort((a, b) => {
      const nameA = String(a?.name ?? a?.key ?? a?.id ?? '');
      const nameB = String(b?.name ?? b?.key ?? b?.id ?? '');
      return nameA.localeCompare(nameB);
    });

    return result;
  }, [items]);

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
