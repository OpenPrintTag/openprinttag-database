import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Box, ChevronRight, Package } from 'lucide-react';
import React from 'react';

import { CountBadgeSkeleton } from '~/components/skeletons';
import type { Brand } from '~/types/brand';
import { slugifyName } from '~/utils/slug';

interface BrandCardProps {
  brand: Brand;
}

interface BrandCounts {
  brandId: string;
  material_count: number;
  package_count: number;
}

export const BrandCard: React.FC<BrandCardProps> = ({ brand }) => {
  const id = slugifyName(brand.name) || brand.slug || brand.uuid;

  // Fetch counts for this specific brand
  const { data: counts } = useQuery({
    queryKey: [`/api/brands/${id}/counts`],
    queryFn: async () => {
      const res = await fetch(`/api/brands/${id}/counts`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return (await res.json()) as BrandCounts;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: typeof window !== 'undefined' && !!id,
  });

  const materialCount = counts?.material_count ?? 0;
  const packageCount = counts?.package_count ?? 0;
  const isLoadingCounts = !counts;

  return (
    <Link
      key={String(id)}
      to="/brands/$brandId"
      params={{ brandId: String(id) }}
      className="cursor-pointer"
    >
      <button className="group block w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-orange-300 hover:shadow-md">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex-1 text-sm font-semibold text-gray-900 group-hover:text-orange-600">
            {brand.name}
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-600" />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {isLoadingCounts ? (
            <>
              <CountBadgeSkeleton />
              <CountBadgeSkeleton />
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                <Box className="h-3 w-3" />
                {materialCount} {materialCount === 1 ? 'material' : 'materials'}
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                <Package className="h-3 w-3" />
                {packageCount} {packageCount === 1 ? 'package' : 'packages'}
              </div>
            </>
          )}
        </div>
      </button>
    </Link>
  );
};
