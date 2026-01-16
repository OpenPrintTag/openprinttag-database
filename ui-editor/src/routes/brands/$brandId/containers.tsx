import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { ChevronRight, Package, Plus } from 'lucide-react';
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

  const filteredContainers = React.useMemo(() => {
    if (!containersList) return [];
    return containersList.filter((c: any) => c.brand?.slug === brandId);
  }, [containersList, brandId]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/brands/$brandId/containers/create"
          params={{ brandId }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
        >
          <Plus className="h-4 w-4" />
          Add Container
        </Link>
        <span
          className="text-sm"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          {filteredContainers.length} containers • Press ⌘K to search
        </span>
      </div>

      {brandLoading && <CardGridSkeleton count={6} />}

      {!brandLoading && filteredContainers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12">
          <Package className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">
            No containers found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            This brand doesn&apos;t have any containers yet.
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
