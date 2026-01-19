import { createFileRoute } from '@tanstack/react-router';
import { Building2 } from 'lucide-react';
import React from 'react';

import { Brand } from '~/components/brand-sheet/types';
import { BrandCard } from '~/components/BrandCard';
import { PageHeader } from '~/components/PageHeader';
import { StateDisplay } from '~/components/StateDisplay';
import { useEnum } from '~/hooks/useEnum';

import { getOS } from '~/utils/os';
export const Route = createFileRoute('/brands/')({
  component: RouteComponent,
});

function RouteComponent() {
  const isMac = getOS() === 'MacOS';
  const shortcut = isMac ? '⌘K' : 'CTRL+K';
  const { data: enums, loading, error } = useEnum('brands');
  const brands = (enums?.items as Brand[]) ?? [];

  // Sort brands by name A-Z
  const sortedBrands = React.useMemo(() => {
    return [...brands].sort((a, b) =>
      (a.name ?? '').localeCompare(b.name ?? ''),
    );
  }, [brands]);

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <PageHeader
        title="Material Brands"
        description={`Browse ${brands.length} material brands in the database. Use ${shortcut} to search.`}
      />

      <StateDisplay error={error} loading={loading && brands.length === 0} />
      {/* Empty State - No Brands */}
      {!loading && !error && brands.length === 0 && (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 text-center shadow-sm"
          style={{
            borderColor: 'hsl(var(--border))',
            backgroundColor: 'hsl(var(--accent))',
          }}
        >
          <div
            className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full"
            style={{ backgroundColor: 'hsl(var(--muted))' }}
          >
            <Building2
              className="h-12 w-12"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            />
          </div>
          <h3
            className="mb-3 text-xl font-bold"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            No brands found
          </h3>
          <p
            className="text-base"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            There are no brands in the database yet.
          </p>
        </div>
      )}

      {/* Brands Grid */}
      {!loading && !error && sortedBrands.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedBrands.map((brand) => (
            <BrandCard key={brand.uuid || brand.slug} brand={brand} />
          ))}
        </div>
      )}
    </div>
  );
}
