import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { ChevronRight, Plus, Search, X } from 'lucide-react';
import React from 'react';

import { ContainersContext, useBrandContext } from '~/context/EntityContexts';
import { CardGridSkeleton } from '~/shared/components/card-skeleton';

export const Route = createFileRoute('/brands/$brandId/containers')({
  component: ContainersLayout,
});

function ContainersLayout() {
  const { brandId } = Route.useParams();
  const {
    containers: containersList,
    loading: brandLoading,
    refetchContainers,
  } = useBrandContext();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const filteredContainers = React.useMemo(() => {
    if (!containersList) return [];
    const brandContainers = containersList.filter(
      (c: any) => c.brand?.slug === brandId,
    );
    const query = debouncedSearch.toLowerCase();
    if (!query) return brandContainers;
    return brandContainers.filter((c: any) => {
      const name = String(c.name ?? '').toLowerCase();
      const slug = String(c.slug ?? '').toLowerCase();
      const uuid = String(c.uuid ?? '').toLowerCase();
      return (
        name.includes(query) || slug.includes(query) || uuid.includes(query)
      );
    });
  }, [containersList, brandId, debouncedSearch]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/brands/$brandId/containers/create"
          params={{ brandId }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
        >
          <Plus className="h-4 w-4" />
          Add Container
        </Link>

        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search containers..."
            className="w-full rounded-md border border-gray-300 py-2 pr-10 pl-10 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {brandLoading && <CardGridSkeleton count={6} />}

      {!brandLoading && filteredContainers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12">
          <ChevronRight className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">
            No containers found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {debouncedSearch
              ? 'No containers match your search criteria.'
              : "This brand doesn't have any containers yet."}
          </p>
        </div>
      )}

      {!brandLoading && filteredContainers.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredContainers.map((container: any) => {
            const containerId = container.slug || container.uuid;
            return (
              <Link
                key={container.uuid}
                to="/brands/$brandId/containers/$containerId"
                params={{ brandId, containerId }}
                className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:border-orange-300 hover:shadow-md"
              >
                <div className="p-5">
                  <h3 className="line-clamp-1 text-lg font-semibold text-gray-900 group-hover:text-orange-600">
                    {container.name}
                  </h3>
                  {container.slug && (
                    <p className="mt-1 font-mono text-xs text-gray-500">
                      {container.slug}
                    </p>
                  )}
                </div>
                <div className="mt-auto border-t border-gray-50 bg-gray-50/50 px-5 py-3 transition-colors group-hover:bg-orange-50/50">
                  <div className="flex items-center justify-between text-xs font-medium text-gray-500 group-hover:text-orange-600">
                    <span>View details</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <ContainersContext.Provider value={{ refetchContainers }}>
        <Outlet />
      </ContainersContext.Provider>
    </>
  );
}
