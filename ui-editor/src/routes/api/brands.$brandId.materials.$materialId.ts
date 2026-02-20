import { createFileRoute } from '@tanstack/react-router';

import {
  createDeleteHandler,
  createGetHandler,
  createPutHandler,
  readNestedByBrand,
  readSingleEntity,
} from '~/server/http';

// GET /api/brands/$brandId/materials/$materialId
export const Route = createFileRoute(
  '/api/brands/$brandId/materials/$materialId',
)({
  server: {
    handlers: {
      GET: createGetHandler('materials', 'materialId', true),
      PUT: createPutHandler(
        'materials',
        'materialId',
        true,
        async (id, payload, params) => {
          const { brandId } = params;
          // Read existing data to check if name changed
          const existing = (await readNestedByBrand(
            'materials',
            brandId,
            id,
          )) as any;
          if (existing && typeof existing === 'object' && 'name' in existing) {
            // If name changed, regenerate UUID
            if (payload.name && payload.name !== existing.name) {
              // Get brand UUID to generate material UUID
              const brand = (await readSingleEntity('brands', brandId)) as any;
              if (brand && typeof brand === 'object' && brand.uuid) {
                const { generateMaterialUuid } =
                  await import('~/server/uuid-utils');
                payload.uuid = generateMaterialUuid(
                  brand.uuid as string,
                  payload.name,
                );
              }
            } else if (!payload.uuid && existing.uuid) {
              // Preserve existing UUID if not provided
              payload.uuid = existing.uuid;
            }
          }
          return payload;
        },
      ),
      DELETE: createDeleteHandler('materials', 'materialId', true),
    },
  },
});
