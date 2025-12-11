import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import React from 'react';

import { SidebarSearch } from '~/components/SidebarSearch';
import {
  type ColorsById,
  ColorsLookupProvider,
} from '~/context/ColorsLookupContext';
import { useApi } from '~/hooks/useApi';
import { useSidebarSearch } from '~/hooks/useSidebarSearch';
import type { Material } from '~/types/material';

export const Route = createFileRoute('/brands/$brandId/materials')({
  component: MaterialsByBrandComponent,
});

function MaterialsByBrandComponent() {
  const { brandId } = Route.useParams();
  const { data, error, loading } = useApi<Material[]>(
    () => `/api/brands/${brandId}/materials`,
    undefined,
    [brandId],
  );
  // Load colors lookup once at this list route level
  const colorsQuery = useApi<any>(() => `/api/enum/colors`, undefined, []);
  const colorsMap: ColorsById | null = React.useMemo(() => {
    const items = Array.isArray(colorsQuery.data?.items)
      ? colorsQuery.data.items
      : null;
    if (!items) return null;
    const byId: ColorsById = {};
    for (const it of items) {
      const id = String(it?.uuid ?? it?.id ?? it?.slug ?? '');
      if (id) byId[id] = it;
    }
    return byId;
  }, [colorsQuery.data]);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { query, setQuery, debounced } = useSidebarSearch('q');

  const materials = data ?? [];
  const filtered = React.useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter((m) => {
      const name = String(m.name ?? '').toLowerCase();
      const slug = String(m.slug ?? '').toLowerCase();
      const uuid = String(m.uuid ?? '').toLowerCase();
      const id = String(m.id ?? '').toLowerCase();
      return (
        name.includes(q) ||
        slug.includes(q) ||
        uuid.includes(q) ||
        id.includes(q)
      );
    });
  }, [materials, debounced]);

  if (loading && !data)
    return <div className="text-gray-600">Loading materials…</div>;
  if (error) return <div className="text-red-700">Error: {error}</div>;

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h5 className="text-lg font-semibold">Materials for this brand</h5>
        <Link
          to="/brands/$brandId"
          params={{ brandId }}
          className="btn-secondary"
        >
          Back to brand
        </Link>
      </div>

      {/* Small screens: toggleable sidebar */}
      <div className="mb-2 md:hidden">
        <button
          className="btn-secondary"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-expanded={sidebarOpen}
          aria-controls="materials-sidebar"
        >
          {sidebarOpen ? 'Hide list' : 'Show list'}
        </button>
      </div>

      <div className="flex gap-4">
        {/* Sidebar list */}
        <aside
          id="materials-sidebar"
          className={`w-64 shrink-0 self-start rounded-md border border-gray-200 bg-white md:sticky md:top-24 md:max-h-[70vh] md:overflow-auto ${sidebarOpen ? 'block' : 'hidden'} md:block`}
        >
          <SidebarSearch
            value={query}
            onChange={setQuery}
            placeholder="Search materials…"
          />
          {filtered.length === 0 && (
            <div className="p-3 text-xs text-gray-600">
              {debounced
                ? `No results for "${debounced}".`
                : 'No materials found for this brand.'}
            </div>
          )}
          {filtered.length > 0 && (
            <ul className="divide-y divide-gray-200">
              {filtered.map((m) => {
                const id = String((m.slug as string) || (m.uuid as string));
                const name = String(m.name ?? id);
                return (
                  <li key={id}>
                    <Link
                      to="/brands/$brandId/materials/$materialId"
                      params={{ brandId, materialId: id }}
                      className="block px-3 py-2 text-sm hover:bg-gray-50"
                      activeProps={{ className: 'active-soft' }}
                    >
                      <div className="truncate">{name}</div>
                      {m.slug ? (
                        <div className="truncate text-[11px] text-gray-500">
                          {String(m.slug)}
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
          <ColorsLookupProvider value={colorsMap}>
            <Outlet />
          </ColorsLookupProvider>
        </div>
      </div>
    </div>
  );
}
