import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import { Brand } from '~/components/brand-sheet/types';
import { countNestedEntitiesByBrand } from '~/server/data/fs';

export const Route = createFileRoute('/api/brands/basic')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ request }) => {
        console.info('GET /api/brands/basic @', request.url);

        const { readAllEntities } = await import('~/server/data/fs');

        let containers: any;
        try {
          containers = await readAllEntities('material-containers', {
            validate: (obj) =>
              !!obj && (!!obj.slug || !!obj.uuid || !!obj.name),
          });
        } catch (_error) {
          // Ignore errors, keep count as 0
        }

        const data = await readAllEntities('brands', {
          validate: (obj) => !!obj && (!!obj.name || !!obj.uuid),
        });

        if (!Array.isArray(data)) {
          return json({ error: data.error }, { status: data.status ?? 500 });
        }

        // Return brands without counts for fast initial load
        const brands: Brand[] = (await Promise.all(
          data.map(async ({ __file, ...brand }) => {
            // Count materials
            let materialCount = 0;
            try {
              materialCount = await countNestedEntitiesByBrand(
                'materials',
                brand.slug,
              );
            } catch (_error) {
              // Ignore errors, keep count as 0
              console.warn(
                `Failed to count materials for brand ${brand.slug}:`,
                _error,
              );
            }

            // Count packages
            let packageCount = 0;
            try {
              packageCount = await countNestedEntitiesByBrand(
                'material-packages',
                brand.slug,
              );
            } catch (_error) {
              // Ignore errors, keep count as 0
              console.warn(
                `Failed to count packages for brand ${brand.slug}:`,
                _error,
              );
            }

            let containerCount = 0;
            if (Array.isArray(containers)) {
              containerCount = containers.filter(
                (c: any) => c?.brand?.slug === brand.slug,
              ).length;
            }

            return {
              ...brand,
              material_count: materialCount,
              package_count: packageCount,
              container_count: containerCount,
            };
          }),
        )) as Brand[];

        return json(brands);
      },
    },
  },
});
