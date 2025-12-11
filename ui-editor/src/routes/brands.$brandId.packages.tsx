import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import React from 'react';

import { SidebarSearch } from '~/components/SidebarSearch';
import { useApi } from '~/hooks/useApi';
import { useSidebarSearch } from '~/hooks/useSidebarSearch';

type Package = Record<string, unknown>;

export const Route = createFileRoute('/brands/$brandId/packages')({
  component: PackagesByBrandComponent,
});

function PackagesByBrandComponent() {
  const { brandId } = Route.useParams();
  const { data, error, loading } = useApi<Package[]>(
    () => `/api/brands/${brandId}/packages`,
    undefined,
    [brandId],
  );
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { query, setQuery, debounced } = useSidebarSearch('q');

  if (loading && !data)
    return <div className="text-gray-600">Loading packages…</div>;
  if (error) return <div className="text-red-700">Error: {error}</div>;

  const packages = data ?? [];
  const filtered = React.useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return packages;
    return packages.filter((p: any) => {
      const name = String(p.name ?? '').toLowerCase();
      const slug = String(p.slug ?? '').toLowerCase();
      const uuid = String(p.uuid ?? '').toLowerCase();
      const id = String(p.id ?? '').toLowerCase();
      return (
        name.includes(q) ||
        slug.includes(q) ||
        uuid.includes(q) ||
        id.includes(q)
      );
    });
  }, [packages, debounced]);
  return (
    <div className="mt-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h5 className="text-lg font-semibold">Packages for this brand</h5>
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
          aria-controls="packages-sidebar"
        >
          {sidebarOpen ? 'Hide list' : 'Show list'}
        </button>
      </div>

      <div className="flex gap-4">
        {/* Sidebar list */}
        <aside
          id="packages-sidebar"
          className={`w-64 shrink-0 self-start rounded-md border border-gray-200 bg-white md:sticky md:top-24 md:max-h-[70vh] md:overflow-auto ${sidebarOpen ? 'block' : 'hidden'} md:block`}
        >
          <SidebarSearch
            value={query}
            onChange={setQuery}
            placeholder="Search packages…"
          />
          {filtered.length === 0 && (
            <div className="p-3 text-xs text-gray-600">
              {debounced
                ? `No results for "${debounced}".`
                : 'No packages found for this brand.'}
            </div>
          )}
          {filtered.length > 0 && (
            <ul className="divide-y divide-gray-200">
              {filtered.map((p: any) => {
                const id = String(p.slug || p.uuid || p.id);
                const name = String(p.name ?? id);
                return (
                  <li key={id}>
                    <Link
                      to="/brands/$brandId/packages/$packageId"
                      params={{ brandId, packageId: id }}
                      className="block px-3 py-2 text-sm hover:bg-gray-50"
                      activeProps={{ className: 'active-soft' }}
                    >
                      <div className="truncate">{name}</div>
                      {p.slug ? (
                        <div className="truncate text-[11px] text-gray-500">
                          {String(p.slug)}
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

export default PackagesByBrandComponent;
