import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronRight, Database, Loader2 } from 'lucide-react';

import { PageHeader } from '~/components/PageHeader';
import { useEnumList } from '~/hooks/useEnum';
import { formatEnumLabel } from '~/routes/enum.$table';

export const Route = createFileRoute('/enum/')({
  component: EnumIndex,
});

function EnumIndex() {
  const { tables, loading, error } = useEnumList();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      {/* Header Section */}
      <PageHeader
        title="Enums"
        description={`Browse ${tables.length} enums in the database. Press ⌘K to search.`}
      />

      {/* Background Loading Indicator */}
      {loading && tables.length > 0 && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Updating tables...</span>
        </div>
      )}

      {/* Loading State */}
      {loading && tables.length === 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
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
      {!loading && error && tables.length === 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <div className="text-sm font-medium text-red-900">
            Error loading tables
          </div>
          <div className="mt-1 text-xs text-red-700">{error}</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && tables.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
            <Database className="h-10 w-10 text-gray-500" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            No tables found
          </h3>
          <p className="text-sm text-gray-600">
            There are no lookup tables in the database yet.
          </p>
        </div>
      )}

      {/* Tables Grid */}
      {!loading && !error && tables.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => {
            const label = formatEnumLabel(table);
            return (
              <Link
                key={table}
                to="/enum/$table"
                params={{ table }}
                className="cursor-pointer"
              >
                <button className="group block w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-orange-300 hover:shadow-md">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex-1 text-sm font-semibold text-gray-900 group-hover:text-orange-600">
                      {label}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-600" />
                  </div>
                  <div className="text-xs text-gray-500">{table}</div>
                </button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
