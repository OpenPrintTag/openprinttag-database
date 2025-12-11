import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import React from 'react';

import { SidebarSearch } from '~/components/SidebarSearch';
import { useApi } from '~/hooks/useApi';
import { useSidebarSearch } from '~/hooks/useSidebarSearch';
import { slugifyName } from '~/utils/slug';

type Accessory = Record<string, unknown>;

export const Route = createFileRoute('/accessories')({
  component: AccessoriesList,
});

function AccessoriesList() {
  const { data, error, loading } = useApi<Accessory[]>(
    '/api/devices/accessories',
  );
  const items = data ?? [];
  const { query, setQuery, debounced } = useSidebarSearch('q');
  const filtered = React.useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const name = String(it.name ?? '').toLowerCase();
      const slug = String(it.slug ?? '').toLowerCase();
      const uuid = String(it.uuid ?? '').toLowerCase();
      const id = String(it.id ?? '').toLowerCase();
      return (
        name.includes(q) ||
        slug.includes(q) ||
        uuid.includes(q) ||
        id.includes(q)
      );
    });
  }, [items, debounced]);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  return (
    <div className="w-full pt-3">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-2xl font-bold">Accessories</h2>
      </div>
      {loading && !data ? (
        <div className="text-gray-600">Loading accessories…</div>
      ) : null}
      {error ? <div className="text-red-700">Error: {error}</div> : null}

      {/* Small screens: toggleable sidebar */}
      <div className="mb-2 md:hidden">
        <button
          className="btn-secondary"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-expanded={sidebarOpen}
          aria-controls="accessories-sidebar"
        >
          {sidebarOpen ? 'Hide list' : 'Show list'}
        </button>
      </div>

      <div className="flex gap-4">
        {/* Sidebar list: persistent & scrollable */}
        <aside
          id="accessories-sidebar"
          className={`w-64 shrink-0 self-start rounded-md border border-gray-200 bg-white md:sticky md:top-24 md:max-h-[70vh] md:overflow-auto ${sidebarOpen ? 'block' : 'hidden'} md:block`}
        >
          <SidebarSearch
            value={query}
            onChange={setQuery}
            placeholder="Search accessories…"
          />
          {filtered.length === 0 && (
            <div className="p-3 text-xs text-gray-600">
              {debounced
                ? `No results for "${debounced}".`
                : 'No accessories found.'}
            </div>
          )}
          {filtered.length > 0 && (
            <ul className="divide-y divide-gray-200">
              {filtered.map((it) => {
                const id =
                  (it.slug as string) ||
                  (it.uuid as string) ||
                  String(it.id ?? '') ||
                  slugifyName(String(it.name ?? '')) ||
                  '';
                const name = String(it.name ?? id);
                return (
                  <li key={String(id)}>
                    <Link
                      to="/accessories/$id"
                      params={{ id: String(id) }}
                      className="block px-3 py-2 text-sm hover:bg-gray-50"
                      activeProps={{ className: 'active-soft' }}
                    >
                      <div className="truncate">{name}</div>
                    </Link>
                  </li>
                );
              })}
            </ul>
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
