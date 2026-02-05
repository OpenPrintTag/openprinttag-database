import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import { Material } from '~/components/material-sheet';
import {
  deleteNestedByBrand,
  jsonError,
  parseJsonSafe,
  readNestedByBrand,
  writeNestedByBrand,
} from '~/server/http';
import { invalidateSearchIndex } from '~/server/searchIndex';

// GET /api/brands/$brandId/materials/$materialId
export const Route = createFileRoute(
  '/api/brands/$brandId/materials/$materialId',
)({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { brandId, materialId } = params;
        console.info(
          `GET /api/brands/${brandId}/materials/${materialId} @`,
          request.url,
        );
        const result = await readNestedByBrand(
          'materials',
          brandId,
          materialId,
        );
        const errRes = jsonError(result, 404);
        if (errRes) return errRes;
        return json(result as Material);
      },
      PUT: async ({ params, request }) => {
        const { brandId, materialId } = params;
        console.info(
          `PUT /api/brands/${brandId}/materials/${materialId} @`,
          request.url,
        );
        const body = await parseJsonSafe(request);
        if (!body.ok) return body.response;

        const payload = body.value as any;

        // Read existing data to check if name changed
        const existing = await readNestedByBrand(
          'materials',
          brandId,
          materialId,
        );
        if (existing && typeof existing === 'object' && 'name' in existing) {
          const existingMaterial = existing as Material;
          // If name changed, regenerate UUID
          if (payload.name && payload.name !== existingMaterial.name) {
            // Get brand UUID to generate material UUID
            const { readSingleEntity } = await import('~/server/http');
            const brand = await readSingleEntity('brands', brandId);
            if (
              brand &&
              typeof brand === 'object' &&
              'uuid' in brand &&
              brand.uuid
            ) {
              const { generateMaterialUuid } =
                await import('~/server/uuid-utils');
              payload.uuid = generateMaterialUuid(
                brand.uuid as string,
                payload.name,
              );
            }
          } else if (!payload.uuid && existingMaterial.uuid) {
            // Preserve existing UUID if not provided
            payload.uuid = existingMaterial.uuid;
          }
        }

        if (typeof payload.brand === 'string') {
          payload.brand = { slug: payload.brand };
        }

        const result = await writeNestedByBrand(
          'materials',
          brandId,
          materialId,
          payload,
        );
        const errRes = jsonError(result, 500);
        if (errRes) return errRes;
        invalidateSearchIndex();
        return json(payload);
      },
      DELETE: async ({ params, request }) => {
        const { brandId, materialId } = params;
        console.info(
          `DELETE /api/brands/${brandId}/materials/${materialId} @`,
          request.url,
        );
        const result = await deleteNestedByBrand(
          'materials',
          brandId,
          materialId,
        );
        const errRes = jsonError(result, 500);
        if (errRes) return errRes;
        invalidateSearchIndex();
        return json({ ok: true });
      },
    },
  },
});
