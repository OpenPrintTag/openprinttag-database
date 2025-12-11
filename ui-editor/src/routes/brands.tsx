import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from '@tanstack/react-router';
import React from 'react';

import { SidebarSearch } from '~/components/SidebarSearch';
import { useApi } from '~/hooks/useApi';
import { useSidebarSearch } from '~/hooks/useSidebarSearch';
import type { Brand } from '~/types/brand';
import { slugifyName } from '~/utils/slug';

export const Route = createFileRoute('/brands')({
  component: BrandsComponent,
});

function BrandsComponent() {
  const { data, error, loading } = useApi<Brand[]>('/api/brands');
  const brands = data ?? [];
  const { query, setQuery, debounced } = useSidebarSearch('q');
  const filtered = React.useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => {
      const name = String(b.name ?? '').toLowerCase();
      const slug = String(b.slug ?? '').toLowerCase();
      const uuid = String(b.uuid ?? '').toLowerCase();
      const kws = Array.isArray(b.keywords)
        ? b.keywords.join(' ').toLowerCase()
        : '';
      return (
        name.includes(q) ||
        slug.includes(q) ||
        uuid.includes(q) ||
        kws.includes(q)
      );
    });
  }, [brands, debounced]);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();
  const isNestedSidebarRoute = React.useMemo(() => {
    // When inside /brands/$brandId/materials or /brands/$brandId/packages (and their details),
    // we should NOT render the brands sidebar layout (to avoid nested sidebars)
    return /\/brands\/.+\/(materials|packages)(\/.*)?$/.test(location.pathname);
  }, [location.pathname]);

  return (
    <div className="w-full">
      {isNestedSidebarRoute ? (
        // When viewing materials pages, let the child route fully control layout
        <Outlet />
      ) : (
        <>
          {loading && !data ? (
            <div className="text-gray-600">Loading brands…</div>
          ) : null}
          {error ? <div className="text-red-700">Error: {error}</div> : null}

          {/* Small screens: toggleable sidebar */}
          <div className="mb-2 md:hidden">
            <button
              className="btn-secondary"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-expanded={sidebarOpen}
              aria-controls="brands-sidebar"
            >
              {sidebarOpen ? 'Hide list' : 'Show list'}
            </button>
          </div>

          <div className="flex gap-4">
            <div className="w-64 shrink-0">
              <div className="mb-3">
                <h2 className="text-2xl font-bold tracking-tight">Brands</h2>
                <div className="mt-1 text-sm text-gray-600">
                  {loading ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1 w-1 animate-pulse rounded-full bg-gray-400"></span>
                      <span
                        className="h-1 w-1 animate-pulse rounded-full bg-gray-400"
                        style={{ animationDelay: '0.2s' }}
                      ></span>
                      <span
                        className="h-1 w-1 animate-pulse rounded-full bg-gray-400"
                        style={{ animationDelay: '0.4s' }}
                      ></span>
                      <span className="ml-1">Loading</span>
                    </span>
                  ) : (
                    <>
                      <span className="font-semibold text-gray-900">
                        {brands.length}
                      </span>{' '}
                      brand{brands.length !== 1 ? 's' : ''} available
                    </>
                  )}
                </div>
              </div>
              {/* Sidebar list: persistent & scrollable */}
              <aside
                id="brands-sidebar"
                className={`self-start rounded-lg border border-gray-200 bg-white shadow-sm md:sticky md:top-24 md:max-h-[70vh] md:overflow-auto ${sidebarOpen ? 'block' : 'hidden'} md:block`}
              >
                <div className="sticky top-0 z-10 rounded-t-lg bg-white">
                  <SidebarSearch
                    value={query}
                    onChange={setQuery}
                    placeholder="Search brands…"
                  />
                  {debounced && filtered.length > 0 && (
                    <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-600">
                      Found {filtered.length} result
                      {filtered.length !== 1 ? 's' : ''}
                    </div>
                  )}
                  {filtered.length > 0 && (
                    <div className="border-t border-gray-200"></div>
                  )}
                </div>
                {filtered.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-500">
                    {debounced ? (
                      <>
                        <div className="mb-1 font-medium">No results found</div>
                        <div className="text-xs">
                          Try searching for &ldquo;{debounced}&rdquo; with
                          different keywords
                        </div>
                      </>
                    ) : (
                      'No brands found.'
                    )}
                  </div>
                )}
                {filtered.length > 0 && (
                  <ul className="divide-y divide-gray-100">
                    {filtered.map((brand) => {
                      const id =
                        slugifyName(brand.name) || brand.slug || brand.uuid;
                      return (
                        <li key={String(id)}>
                          <Link
                            to="/brands/$brandId"
                            params={{ brandId: String(id) }}
                            className="block px-3 py-2 text-sm hover:bg-gray-50"
                            activeProps={{ className: 'active-soft' }}
                          >
                            <div className="truncate font-medium">
                              {brand.name}
                            </div>
                            {brand.slug ? (
                              <div className="mt-0.5 truncate text-xs text-gray-500">
                                {brand.slug}
                              </div>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </aside>
            </div>

            {/* Detail pane */}
            <div className="min-w-0 flex-1">
              <Outlet />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
