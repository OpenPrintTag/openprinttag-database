import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import { jsonError, readSingleEntity as readEntity } from '~/server/http';
import type { Material } from '~/types/material';

export const Route = createFileRoute('/api/materials/$materialId')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const id = params.materialId;
        console.info(`GET /api/materials/${id} @`, request.url);
        const result = await readEntity('materials', id);
        const errRes = jsonError(result, 404);
        if (errRes) return errRes;
        return json(result as Material);
      },
    },
  },
});
