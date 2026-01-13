import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { Box, ChevronRight, Plus, Search, X } from 'lucide-react';
import React, { useMemo } from 'react';

import { Badge } from '~/components/ui';
import { useBrandContext } from '~/context/EntityContexts';
import { useEnum } from '~/hooks/useEnum';
import { CardGridSkeleton } from '~/shared/components/card-skeleton';

export const Route = createFileRoute('/brands/$brandId/materials')({
  component: MaterialsLayout,
});

function MaterialsLayout() {
  const { brandId } = Route.useParams();
  const { materials: materialsData, loading: brandLoading } = useBrandContext();

  const { data: tagsData } = useEnum('material_tags');

  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  const tagLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    const items = tagsData?.items ?? [];
    for (const item of items as any[]) {
      const key = (item as any).name;
      map[key] = item.display_name;
    }
    return map;
  }, [tagsData]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const filteredMaterials = React.useMemo(() => {
    if (!materialsData) return [];
    const query = debouncedSearch.toLowerCase();
    if (!query) return materialsData;
    return materialsData.filter((m) => {
      const name = String(m.name ?? '').toLowerCase();
      const slug = String(m.slug ?? '').toLowerCase();
      const uuid = String(m.uuid ?? '').toLowerCase();
      return (
        name.includes(query) || slug.includes(query) || uuid.includes(query)
      );
    });
  }, [materialsData, debouncedSearch]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/brands/$brandId/materials/create"
          params={{ brandId }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
        >
          <Plus className="h-4 w-4" />
          Add Material
        </Link>

        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search materials..."
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

      {brandLoading && <CardGridSkeleton count={12} />}

      {!brandLoading && filteredMaterials.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12">
          <Box className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">
            No materials found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {debouncedSearch
              ? 'No materials match your search criteria.'
              : "This brand doesn't have any materials yet."}
          </p>
        </div>
      )}

      {!brandLoading && filteredMaterials.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((material) => {
            const materialId = material.slug || material.uuid;
            return (
              <Link
                key={material.uuid}
                resetScroll={false}
                to="/brands/$brandId/materials/$materialId"
                params={{ brandId, materialId }}
                className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:border-orange-300 hover:shadow-md"
              >
                <div className="p-5 pb-0">
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="line-clamp-1 text-lg font-semibold text-gray-900 group-hover:text-orange-600">
                      {material.name}
                    </h3>
                  </div>
                  {material.slug && (
                    <p className="mb-3 font-mono text-xs text-gray-500">
                      {material.slug}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {(material.tags || []).slice(0, 3).map((tag: string) => (
                      <Badge variant="outline" key={tag}>
                        {tagLabelMap[tag] || tag}
                      </Badge>
                    ))}
                    {(material.tags || []).length > 3 && (
                      <span className="text-[10px] text-gray-400">
                        +{(material.tags || []).length - 3} more
                      </span>
                    )}
                  </div>
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
      <Outlet />
    </>
  );
}
