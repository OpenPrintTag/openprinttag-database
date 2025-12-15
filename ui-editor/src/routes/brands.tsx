import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from '@tanstack/react-router';
import { ChevronRight, Frown, Menu } from 'lucide-react';
import React from 'react';

import { SidebarSearch } from '~/components/SidebarSearch';
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScrollArea,
  Skeleton,
} from '~/components/ui';
import { useApi } from '~/hooks/useApi';
import { useSidebarSearch } from '~/hooks/useSidebarSearch';
import type { Brand } from '~/types/brand';
import { slugifyName } from '~/utils/slug';

export const Route = createFileRoute('/brands')({
  component: BrandsComponent,
});

// Helper to get brand initials for avatar
const getBrandInitials = (name: string): string => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

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
            <Button
              variant="outline"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-expanded={sidebarOpen}
              aria-controls="brands-sidebar"
              className="w-full"
            >
              <Menu className="mr-2 h-4 w-4" />
              {sidebarOpen ? 'Hide brands' : 'Show brands'}
            </Button>
          </div>

          <div className="flex gap-6">
            <div className="w-80 shrink-0">
              <Card
                className={`md:sticky md:top-24 ${sidebarOpen ? 'block' : 'hidden'} md:block`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Brands</CardTitle>
                    {loading ? (
                      <Skeleton className="h-5 w-12" />
                    ) : (
                      <Badge
                        variant="secondary"
                        className="ml-auto text-xs font-semibold"
                      >
                        {brands.length}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
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
                      `${brands.length} brand${brands.length !== 1 ? 's' : ''} available`
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-0 pb-0">
                  <div className="px-6 pb-3">
                    <SidebarSearch
                      value={query}
                      onChange={setQuery}
                      placeholder="Search brands…"
                    />
                  </div>

                  {debounced && filtered.length > 0 && (
                    <div className="px-6 py-2 text-xs text-gray-600">
                      <span className="font-medium">
                        {filtered.length} result
                        {filtered.length !== 1 ? 's' : ''}
                      </span>{' '}
                      found
                    </div>
                  )}

                  <ScrollArea className="h-[calc(70vh-12rem)]">
                    {loading && !data && (
                      <div className="space-y-2 p-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 rounded-md p-2"
                          >
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-3 w-2/3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!loading && filtered.length === 0 && (
                      <div className="p-8 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                          <Frown className="h-6 w-6 text-gray-400" />
                        </div>
                        {debounced ? (
                          <>
                            <div className="mb-1 text-sm font-medium text-gray-900">
                              No results found
                            </div>
                            <p className="text-xs text-gray-500">
                              Try searching with different keywords
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No brands found.
                          </p>
                        )}
                      </div>
                    )}
                    {!loading && filtered.length > 0 && (
                      <div className="space-y-1 p-2">
                        {filtered.map((brand) => {
                          const id =
                            slugifyName(brand.name) || brand.slug || brand.uuid;
                          return (
                            <Link
                              key={String(id)}
                              to="/brands/$brandId"
                              params={{ brandId: String(id) }}
                              className="group block rounded-md transition-colors hover:bg-gray-50"
                              activeProps={{
                                className: 'bg-orange-50 hover:bg-orange-100',
                              }}
                            >
                              <div className="flex items-center gap-3 p-3">
                                <Avatar className="h-10 w-10 border border-gray-200">
                                  <AvatarFallback className="bg-linear-to-br from-orange-100 to-orange-200 text-sm font-semibold text-orange-700">
                                    {getBrandInitials(brand.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-medium text-gray-900 group-hover:text-orange-600">
                                    {brand.name}
                                  </div>
                                  {brand.slug && (
                                    <div className="mt-0.5 truncate text-xs text-gray-500">
                                      {brand.slug}
                                    </div>
                                  )}
                                </div>
                                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
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
