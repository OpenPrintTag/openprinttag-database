import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import {
  jsonError,
  parseJsonSafe,
  readSingleEntity as readEntity,
  writeSingleEntity as writeEntity,
} from '~/server/http';

export const Route = createFileRoute('/api/devices/printers/$id')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ params, request }) => {
        console.info('GET /api/devices/printers/:id @', request.url);
        const res = await readEntity('devices/printers', params.id);
        const errRes = jsonError(res, 404);
        if (errRes) return errRes;
        return json(res);
      },
      PUT: async ({ params, request }) => {
        console.info('PUT /api/devices/printers/:id @', request.url);
        const body = await parseJsonSafe(request);
        if (!body.ok) return body.response;
        const result = await writeEntity(
          'devices/printers',
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
