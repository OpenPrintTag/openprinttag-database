import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import {
  jsonError,
  parseJsonSafe,
  readNestedByBrand,
  writeNestedByBrand,
} from '~/server/http';
import type { Material } from '~/types/material';

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
        const result = await writeNestedByBrand(
          'materials',
          brandId,
          materialId,
          body.value,
        );
        const errRes = jsonError(result, 500);
        if (errRes) return errRes;
        return json({ ok: true });
      },
    },
  },
});
