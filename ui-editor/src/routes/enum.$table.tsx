import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import React from 'react';

import { SidebarSearch } from '~/components/SidebarSearch';
import { useApi } from '~/hooks/useApi';
import { useSidebarSearch } from '~/hooks/useSidebarSearch';
import { formatEnumLabel } from '~/routes/enum.$table.$id';
import { slugifyName } from '~/utils/slug';

type TableResponse = { items: any[]; meta: { key: string } };

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
  const { query, setQuery, debounced } = useSidebarSearch('q');
  const filtered = React.useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const name = String(it?.name ?? '').toLowerCase();
      const code = String(it?.code ?? '').toLowerCase();
      const slug = String(it?.slug ?? '').toLowerCase();
      const uuid = String(it?.uuid ?? '').toLowerCase();
      const id = String(it?.id ?? '').toLowerCase();
      return (
        name.includes(q) ||
        code.includes(q) ||
        slug.includes(q) ||
        uuid.includes(q) ||
        id.includes(q)
      );
    });
  }, [items, debounced]);

  console.info('enum search state', {
    debounced,
    table,
    count: items.length,
    filtered: filtered.length,
  });
  return (
    <div className="w-full pt-3">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-2xl font-bold">Enum: {formatEnumLabel(table)}</h2>
        <Link to="/enum" className="btn-secondary">
          Back to Enums
        </Link>
      </div>
      {loading && !data ? <div className="text-gray-600">Loading…</div> : null}
      {error ? <div className="text-red-700">Error: {error}</div> : null}

      <div className="flex gap-4">
        {/* Sidebar list: stays mounted and scrollable to preserve position */}
        <aside className="sticky top-24 max-h-[70vh] w-64 shrink-0 self-start overflow-auto rounded-md border border-gray-200 bg-white">
          <SidebarSearch
            value={query}
            onChange={setQuery}
            placeholder={`Search ${formatEnumLabel(table)}…`}
          />
          <ul className="divide-y divide-gray-200">
            {filtered.map((it, idx) => {
              const nameStr = String(it?.name ?? '');
              // Prefer common stable keys for enum items, especially `code` for countries
              const id = String(
                it?.code ??
                  it?.id ??
                  it?.slug ??
                  it?.uuid ??
                  (slugifyName(nameStr) || idx),
              );
              const name = String(it?.name ?? it?.slug ?? id);
              return (
                <li key={id}>
                  <Link
                    to="/enum/$table/$id"
                    params={{ table, id }}
                    className="block px-3 py-2 text-sm hover:bg-gray-50"
                    activeProps={{ className: 'active-soft' }}
                  >
                    {name}
                  </Link>
                </li>
              );
            })}
          </ul>
          {!loading && !error && filtered.length === 0 && (
            <div className="p-3 text-xs text-gray-600">
              {debounced ? `No results for "${debounced}".` : 'No items.'}
            </div>
          )}
        </aside>

        {/* Detail pane */}
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
