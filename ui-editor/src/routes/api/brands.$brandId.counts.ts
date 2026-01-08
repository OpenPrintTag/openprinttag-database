import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

export const Route = createFileRoute('/api/brands/$brandId/counts')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ params }) => {
        const { brandId } = params;

        const {
          readMaterialsByBrand,
          readNestedEntitiesByBrand,
          readAllEntities,
        } = await import('~/server/data/fs');

        // Count materials
        let materialCount = 0;
        try {
          const materials = await readMaterialsByBrand(brandId);
          if (Array.isArray(materials)) {
            materialCount = materials.length;
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
          const packages = await readNestedEntitiesByBrand(
            'material-packages',
            brandId,
          );
          if (Array.isArray(packages)) {
            packageCount = packages.length;
          }
        } catch (_error) {
          // Ignore errors, keep count as 0
          console.warn(
            `Failed to count packages for brand ${brandId}:`,
            _error,
          );
        }

        return json({
          brandId,
          material_count: materialCount,
          package_count: packageCount,
        });
      },
    },
  },
});
