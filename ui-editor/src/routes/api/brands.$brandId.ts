import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import {
  jsonError,
  parseJsonSafe,
  readSingleEntity as readEntity,
  writeSingleEntity as writeEntity,
} from '~/server/http';
import type { Brand } from '~/types/brand';

export const Route = createFileRoute('/api/brands/$brandId')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const id = params.brandId;
        console.info(`GET /api/brands/${id} @`, request.url);
        const result = await readEntity('brands', id);
        const errRes = jsonError(result, 404);
        if (errRes) return errRes;
        return json(result as Brand);
      },
      PUT: async ({ params, request }) => {
        const id = params.brandId;
        console.info(`PUT /api/brands/${id} @`, request.url);
        const body = await parseJsonSafe(request);
        if (!body.ok) return body.response;

        const payload = body.value as any;

        // Read existing data to check if name changed
        const existing = await readEntity('brands', id);
        if (existing && typeof existing === 'object' && 'name' in existing) {
          const existingBrand = existing as Brand;
          // If name changed, regenerate UUID
          if (payload.name && payload.name !== existingBrand.name) {
            const { generateBrandUuid } = await import('~/server/uuid-utils');
            payload.uuid = generateBrandUuid(payload.name);
          } else if (!payload.uuid && existingBrand.uuid) {
            // Preserve existing UUID if not provided
            payload.uuid = existingBrand.uuid;
          }
        }

        const result = await writeEntity('brands', id, payload);
        const errRes = jsonError(result, 500);
        if (errRes) return errRes;
        return json(payload);
      },
    },
  },
});
