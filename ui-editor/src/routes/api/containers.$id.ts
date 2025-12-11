import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import {
  jsonError,
  parseJsonSafe,
  readSingleEntity as readEntity,
  writeSingleEntity as writeEntity,
} from '~/server/http';

export const Route = createFileRoute('/api/containers/$id')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ params, request }) => {
        console.info('GET /api/containers/:id @', request.url);
        const res = await readEntity('material-containers', params.id);
        const errRes = jsonError(res, 404);
        if (errRes) return errRes;
        return json(res);
      },
      PUT: async ({ params, request }) => {
        console.info('PUT /api/containers/:id @', request.url);
        const body = await parseJsonSafe(request);
        if (!body.ok) return body.response;
        const result = await writeEntity(
          'material-containers',
          params.id,
          body.value,
        );
        const errRes = jsonError(result, 500);
        if (errRes) return errRes;
        return json({ ok: true });
      },
    },
  },
});
