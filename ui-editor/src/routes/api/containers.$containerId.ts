import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import { jsonError, readSingleEntity as readEntity } from '~/server/http';

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
    },
  },
});
