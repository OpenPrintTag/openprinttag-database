import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import {
  deleteSingleEntity as deleteEntity,
  jsonError,
  parseJsonSafe,
  readSingleEntity as readEntity,
  writeSingleEntity as writeEntity,
} from '~/server/http';
import { invalidateSearchIndex } from '~/server/searchIndex';

export const Route = createFileRoute('/api/containers/$containerId')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ params, request }) => {
        console.info('GET /api/containers/:containerId @', request.url);
        const res = await readEntity('material-containers', params.containerId);
        const errRes = jsonError(res, 500);
        if (errRes) return errRes;
        return json(res);
      },
      PUT: async ({ params, request }) => {
        console.info('PUT /api/containers/:containerId @', request.url);
        const body = await parseJsonSafe(request);
        if (!body.ok) return body.response;
        const result = await writeEntity(
          'material-containers',
          params.containerId,
          body.value,
        );
        const errRes = jsonError(result, 500);
        if (errRes) return errRes;
        invalidateSearchIndex();
        return json({ ok: true });
      },
      DELETE: async ({ params, request }) => {
        console.info('DELETE /api/containers/:containerId @', request.url);
        const result = await deleteEntity(
          'material-containers',
          params.containerId,
        );
        const errRes = jsonError(result, 500);
        if (errRes) return errRes;
        invalidateSearchIndex();
        return json({ ok: true });
      },
    },
  },
});
