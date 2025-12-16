import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import type { Brand } from '~/types/brand';

export const Route = createFileRoute('/api/brands')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ request }) => {
        console.info('GET /api/brands @', request.url);
        // Avoid importing Node modules in the client bundle: dynamic import inside handler
        const {
          readAllEntities,
          readMaterialsByBrand,
          readNestedEntitiesByBrand,
          slugifyName,
        } = await import('~/server/data/fs');

        const data = await readAllEntities('brands', {
          validate: (obj) => !!obj && (!!obj.name || !!obj.uuid),
        });

        if (!Array.isArray(data)) {
          return json({ error: data.error }, { status: data.status ?? 500 });
        }

        // Enrich brands with material and package counts
        const enrichedBrands: Brand[] = await Promise.all(
          data.map(async ({ __file, ...brand }) => {
            // Get brand identifiers for lookup
            const brandId =
              slugifyName(brand.name) || brand.slug || brand.uuid || brand.id;

            // Count materials
            let materialCount = 0;
            try {
              if (brandId) {
                const materials = await readMaterialsByBrand(brandId);
                if (Array.isArray(materials)) {
                  materialCount = materials.length;
                }
              }
            } catch (_error) {
              // Ignore errors, keep count as 0
              console.warn(
                `Failed to count materials for brand ${brandId}:`,
                _error,
              );
            }

            // Count packages
            let packageCount = 0;
            try {
              if (brandId) {
                const packages = await readNestedEntitiesByBrand(
                  'material-packages',
                  brandId,
                );
                if (Array.isArray(packages)) {
                  packageCount = packages.length;
                }
              }
            } catch (_error) {
              // Ignore errors, keep count as 0
              console.warn(
                `Failed to count packages for brand ${brandId}:`,
                _error,
              );
            }

            return {
              ...brand,
              material_count: materialCount,
              package_count: packageCount,
            } as Brand;
          }),
        );

        return json(enrichedBrands);
      },
    },
  },
});
