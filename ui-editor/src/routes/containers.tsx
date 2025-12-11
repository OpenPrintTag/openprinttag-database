import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import React from 'react';

import { SidebarSearch } from '~/components/SidebarSearch';
import { useApi } from '~/hooks/useApi';
import { useSidebarSearch } from '~/hooks/useSidebarSearch';
import { slugifyName } from '~/utils/slug';

type Container = Record<string, unknown>;

export const Route = createFileRoute('/containers')({
  component: ContainersList,
});

function ContainersList() {
  const { data, error, loading } = useApi<Container[]>('/api/containers');
  const items = data ?? [];
  const { query, setQuery, debounced } = useSidebarSearch('q');
  const filtered = React.useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => {
      const name = String((c as any).name ?? '').toLowerCase();
      const slug = String((c as any).slug ?? '').toLowerCase();
      const uuid = String((c as any).uuid ?? '').toLowerCase();
      const id = String((c as any).id ?? '').toLowerCase();
      const desc = String((c as any).description ?? '').toLowerCase();
      return (
        name.includes(q) ||
        slug.includes(q) ||
        uuid.includes(q) ||
        id.includes(q) ||
        desc.includes(q)
      );
    });
  }, [items, debounced]);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="w-full pt-3">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-2xl font-bold">Material Containers</h2>
      </div>
      {loading && !data ? (
        <div className="text-gray-600">Loading containers…</div>
      ) : null}
      {error ? <div className="text-red-700">Error: {error}</div> : null}

      {/* Small screens: toggleable sidebar */}
      <div className="mb-2 md:hidden">
        <button
          className="btn-secondary"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-expanded={sidebarOpen}
          aria-controls="containers-sidebar"
        >
          {sidebarOpen ? 'Hide list' : 'Show list'}
        </button>
      </div>

      <div className="flex gap-4">
        {/* Sidebar list: persistent & scrollable */}
        <aside
          id="containers-sidebar"
          className={`w-64 shrink-0 self-start rounded-md border border-gray-200 bg-white md:sticky md:top-24 md:max-h-[70vh] md:overflow-auto ${sidebarOpen ? 'block' : 'hidden'} md:block`}
        >
          <SidebarSearch
            value={query}
            onChange={setQuery}
            placeholder="Search containers…"
          />
          {filtered.length === 0 && (
            <div className="p-3 text-xs text-gray-600">
              {debounced
                ? `No results for "${debounced}".`
                : 'No containers found.'}
            </div>
          )}
          {filtered.length > 0 && (
            <ul className="divide-y divide-gray-200">
              {filtered.map((c) => {
                const id =
                  (c.slug as string) ||
                  (c.uuid as string) ||
                  String((c as any).id ?? '') ||
                  slugifyName(String((c as any).name ?? '')) ||
                  '';
                const name = String(c.name ?? id);
                return (
                  <li key={String(id)}>
                    <Link
                      to="/containers/$id"
                      params={{ id: String(id) }}
                      className="block px-3 py-2 text-sm hover:bg-gray-50"
                      activeProps={{ className: 'active-soft' }}
                    >
                      <div className="truncate">{name}</div>
                      {'description' in c && c.description ? (
                        <div className="truncate text-[11px] text-gray-500">
                          {String(c.description as any)}
                        </div>
                      ) : null}
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
