import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import {
  deleteNestedByBrand,
  jsonError,
  parseJsonSafe,
  readNestedByBrand,
  writeNestedByBrand,
} from '~/server/http';
import { invalidateSearchIndex } from '~/server/searchIndex';

export const Route = createFileRoute(
  '/api/brands/$brandId/packages/$packageId',
)({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ params, request }) => {
        const { brandId, packageId } = params;
        console.info(
          `GET /api/brands/${brandId}/packages/${packageId} @`,
          request.url,
        );
        const result = await readNestedByBrand(
          'material-packages',
          brandId,
          packageId,
        );
        const errRes = jsonError(result, 404);
        if (errRes) return errRes;
        return json(result);
      },
      PUT: async ({ params, request }) => {
        const { brandId, packageId } = params;
        console.info(
          `PUT /api/brands/${brandId}/packages/${packageId} @`,
          request.url,
        );
        const body = await parseJsonSafe(request);
        if (!body.ok) return body.response;

        const payload = body.value as any;

        // Read existing data to check if gtin changed
        const existing = await readNestedByBrand(
          'material-packages',
          brandId,
          packageId,
        );
        if (existing && typeof existing === 'object' && 'gtin' in existing) {
          const existingPackage = existing as any;
          // If gtin changed, regenerate UUID
          if (payload.gtin && payload.gtin !== existingPackage.gtin) {
            // Get brand UUID to generate package UUID
            const { readSingleEntity } = await import('~/server/http');
            const brand = await readSingleEntity('brands', brandId);
            if (
              brand &&
              typeof brand === 'object' &&
              'uuid' in brand &&
              brand.uuid
            ) {
              const { generateMaterialPackageUuid } =
                await import('~/server/uuid-utils');
              payload.uuid = generateMaterialPackageUuid(
                brand.uuid as string,
                payload.gtin,
              );
            }
          } else if (!payload.uuid && existingPackage.uuid) {
            // Preserve existing UUID if not provided
            payload.uuid = existingPackage.uuid;
          }
        }

        const result = await writeNestedByBrand(
          'material-packages',
          brandId,
          packageId,
          payload,
        );
        const errRes = jsonError(result, 500);
        if (errRes) return errRes;
        invalidateSearchIndex();
        return json(payload);
      },
      DELETE: async ({ params, request }) => {
        const { brandId, packageId } = params;
        console.info(
          `DELETE /api/brands/${brandId}/packages/${packageId} @`,
          request.url,
        );
        const result = await deleteNestedByBrand(
          'material-packages',
          brandId,
          packageId,
        );
        const errRes = jsonError(result, 500);
        if (errRes) return errRes;
        invalidateSearchIndex();
        return json({ ok: true });
      },
    },
  },
});
