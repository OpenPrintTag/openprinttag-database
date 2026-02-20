import { createFileRoute } from '@tanstack/react-router';

import {
  createGetHandler,
  createPutHandler,
  readSingleEntity,
} from '~/server/http';

export const Route = createFileRoute('/api/brands/$brandId')({
  server: {
    handlers: {
      GET: createGetHandler('brands', 'brandId'),
      PUT: createPutHandler('brands', 'brandId', false, async (id, payload) => {
        // Read existing data to check if name changed
        const existing = (await readSingleEntity('brands', id)) as any;
        if (existing && typeof existing === 'object' && 'name' in existing) {
          // If name changed, regenerate UUID
          if (payload.name && payload.name !== existing.name) {
            const { generateBrandUuid } = await import('~/server/uuid-utils');
            payload.uuid = generateBrandUuid(payload.name);
          } else if (!payload.uuid && existing.uuid) {
            // Preserve existing UUID if not provided
            payload.uuid = existing.uuid;
          }
        }
        return payload;
      }),
    },
  },
});
