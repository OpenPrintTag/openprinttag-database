import { createFileRoute } from '@tanstack/react-router';

import { createPostHandler, readSingleEntity } from '~/server/http';

// POST /api/brands/$brandId/packages/new
export const Route = createFileRoute('/api/brands/$brandId/packages/new')({
  server: {
    handlers: {
      POST: createPostHandler(
        'material-packages',
        true,
        async (payload, params) => {
          const { brandId } = params;

          // Find the brand to get its UUID
          const brand = (await readSingleEntity('brands', brandId)) as any;
          if (!brand || !brand.uuid) {
            throw new Error(`Brand '${brandId}' not found or missing UUID`);
          }

          const { generateMaterialPackageUuid } =
            await import('~/server/uuid-utils');

          // Generate filename - using material and container references
          const materialRef =
            typeof payload.material === 'object'
              ? payload.material?.slug
              : payload.material || payload.material_slug;
          const containerRef =
            typeof payload.container === 'object'
              ? payload.container?.slug
              : payload.container || payload.container_slug || 'unknown';

          if (!payload.slug) {
            payload.slug = `${materialRef}-${containerRef}`.toLowerCase();
          }

          // Generate UUIDv5 for the new package
          const gtin = payload.gtin || `${materialRef}-${containerRef}`;
          payload.uuid = generateMaterialPackageUuid(brand.uuid, gtin);
          payload.brand = { slug: brandId };

          return payload;
        },
      ),
    },
  },
});
