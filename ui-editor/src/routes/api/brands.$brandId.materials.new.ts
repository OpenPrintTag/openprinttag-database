import { createFileRoute } from '@tanstack/react-router';

import { createPostHandler, readSingleEntity } from '~/server/http';

// POST /api/brands/$brandId/materials/new
export const Route = createFileRoute('/api/brands/$brandId/materials/new')({
  server: {
    handlers: {
      POST: createPostHandler('materials', true, async (payload, params) => {
        const { brandId } = params;

        // Find the brand to get its UUID
        const brand = (await readSingleEntity('brands', brandId)) as any;
        if (!brand || !brand.uuid) {
          throw new Error(`Brand '${brandId}' not found or missing UUID`);
        }

        const { generateMaterialUuid } = await import('~/server/uuid-utils');
        payload.uuid = generateMaterialUuid(brand.uuid, payload.name);
        payload.brand = { slug: brandId };

        return payload;
      }),
    },
  },
});
