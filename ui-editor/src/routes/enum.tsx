import { createFileRoute, Link, Outlet } from '@tanstack/react-router';

import { useApi } from '~/hooks/useApi';
import { formatEnumLabel } from '~/routes/enum.$table.$id';

export const Route = createFileRoute('/enum')({
  component: EnumIndex,
});

function EnumIndex() {
  const { data, error, loading } = useApi<{ tables: string[] }>('/api/enum');
  const tables = data?.tables ?? [];
  return (
    <div className="w-full">
      <h2 className="mb-3 text-2xl font-bold">Lookup tables</h2>
      {loading && !data ? (
        <div className="text-gray-600">Loading tables…</div>
      ) : null}
      {error ? <div className="text-red-700">Error: {error}</div> : null}
      <div className="rounded-md border border-gray-200 bg-white">
        <ul className="divide-y divide-gray-200">
          {tables.map((t) => (
            <li key={t}>
              <Link
                to="/enum/$table"
                params={{ table: t }}
                className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
                activeProps={{ className: 'active-soft' }}
              >
                <span className="truncate">{formatEnumLabel(t)}</span>
                <span className="text-xs text-gray-500">Open</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {!loading && !error && tables.length === 0 ? (
        <div className="mt-3 text-sm text-gray-600">No tables found.</div>
      ) : null}
      <Outlet />
    </div>
  );
}
