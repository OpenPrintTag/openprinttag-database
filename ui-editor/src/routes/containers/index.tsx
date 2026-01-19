import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChevronRight, Loader2, Package2, Plus } from 'lucide-react';
import React from 'react';

import { Brand } from '~/components/brand-sheet/types';
import { Container } from '~/components/container-sheet';
import { PageHeader } from '~/components/PageHeader';
import { Button } from '~/components/ui';
import { useEnum } from '~/hooks/useEnum';
import { slugifyName } from '~/utils/slug';
import { getOS } from '~/utils/os';

export const Route = createFileRoute('/containers/')({
  component: RouteComponent,
});

function RouteComponent() {
  const isMac = getOS() === 'MacOS';
  const {
    data: containersData,
    loading: containersLoading,
    error: containersError,
  } = useEnum('containers');
  const { data: brandsData } = useEnum('brands');

  const containers = (containersData?.items as Container[]) ?? [];
  const brands = (brandsData?.items as Brand[]) ?? [];
  const loading = containersLoading;
  const error = containersError;
  const navigate = useNavigate();

  const handleOpenContainerSheet = (
    sheetMode: 'create' | 'edit' | 'view',
    id?: string,
  ) => {
    if (sheetMode === 'view' || sheetMode === 'edit') {
      navigate({
        to: '/containers/$containerId' + (sheetMode === 'edit' ? '/edit' : ''),
        params: { containerId: id! },
        resetScroll: false,
      });
      return;
    }

    if (sheetMode === 'create') {
      navigate({
        to: '/containers/create',
        resetScroll: false,
      });
      return;
    }
  };

  // Create a map of brand_slug to brand name for quick lookup
  const brandMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    brands.forEach((brand) => {
      if (brand.slug) {
        map[brand.slug] = brand.name;
      }
    });
    return map;
  }, [brands]);

  // Sort containers by name A-Z
  const sortedContainers = React.useMemo(() => {
    return [...containers].sort((a, b) => {
      const nameA = String(a.name ?? '');
      const nameB = String(b.name ?? '');
      return nameA.localeCompare(nameB);
    });
  }, [containers]);

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Material Containers"
          description={`Browse ${containers.length} material containers. Press ${isMac ? '⌘K' : 'CTRL+K'} to search.`}
        />
        <button
          onClick={() => handleOpenContainerSheet('create')}
          className="btn flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Container
        </button>
      </div>

      {/* Background Loading Indicator */}
      {loading && containers.length > 0 && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Updating containers...</span>
        </div>
      )}

      {/* Loading State */}
      {loading && containers.length === 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="relative h-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
            >
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && containers.length === 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <div className="text-sm font-medium text-red-900">
            Error loading containers
          </div>
          <div className="mt-1 text-xs text-red-700">{error}</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && containers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
            <Package2 className="h-10 w-10 text-gray-500" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            No containers found
          </h3>
          <p className="text-sm text-gray-600">
            There are no material containers in the database yet.
          </p>
        </div>
      )}

      {/* Containers Grid */}
      {!loading && !error && sortedContainers.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedContainers.map((container) => {
            const id =
              (container.slug as string) ||
              (container.uuid as string) ||
              String((container as any).id ?? '') ||
              slugifyName(String(container.name ?? '')) ||
              '';
            const name = String(container.name ?? id);
            const brandSlug = container.brand_slug as string | undefined;
            const brandName = brandSlug ? brandMap[brandSlug] : undefined;

            return (
              <button
                key={String(id)}
                onClick={() => handleOpenContainerSheet('view', String(id))}
                className="group block w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex-1 text-sm font-semibold text-gray-900 group-hover:text-orange-600">
                    {name}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-600" />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {brandName && (
                    <div className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      {brandName}
                    </div>
                  )}
                  {(container as any).capacity && (
                    <div className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      Capacity: {String((container as any).capacity)}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
