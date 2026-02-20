import { createFileRoute } from '@tanstack/react-router';

import {
  createDeleteHandler,
  createGetHandler,
  createPutHandler,
  readNestedByBrand,
  readSingleEntity,
} from '~/server/http';

export const Route = createFileRoute(
  '/api/brands/$brandId/packages/$packageId',
)({
  server: {
    middleware: [],
    handlers: {
      GET: createGetHandler('material-packages', 'packageId', true),
      PUT: createPutHandler(
        'material-packages',
        'packageId',
        true,
        async (id, payload, params) => {
          const { brandId } = params;
          // Read existing data to check if gtin changed
          const existing = (await readNestedByBrand(
            'material-packages',
            brandId,
            id,
          )) as any;
          if (existing && typeof existing === 'object' && 'gtin' in existing) {
            // If gtin changed, regenerate UUID
            if (payload.gtin && payload.gtin !== existing.gtin) {
              // Get brand UUID to generate package UUID
              const brand = (await readSingleEntity('brands', brandId)) as any;
              if (brand && typeof brand === 'object' && brand.uuid) {
                const { generateMaterialPackageUuid } =
                  await import('~/server/uuid-utils');
                payload.uuid = generateMaterialPackageUuid(
                  brand.uuid as string,
                  payload.gtin,
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
      DELETE: createDeleteHandler('material-packages', 'packageId', true),
    },
  },
});
