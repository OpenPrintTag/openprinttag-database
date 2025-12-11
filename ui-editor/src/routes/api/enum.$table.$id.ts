import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import {
  jsonError,
  parseJsonSafe,
  readLookupTableItem as readItem,
  writeLookupTableItem as writeItem,
} from '~/server/http';

export const Route = createFileRoute('/api/enum/$table/$id')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ params, request }) => {
        console.info('GET /api/enum/:table/:id @', request.url);
        const res = await readItem(params.table, params.id);
        const errRes = jsonError(res, 500);
        if (errRes) return errRes;
        return json(res);
      },
      PUT: async ({ params, request }) => {
        console.info('PUT /api/enum/:table/:id @', request.url);
        const body = await parseJsonSafe(request);
        if (!body.ok) return body.response;
        const result = await writeItem(params.table, params.id, body.value);
        const errRes = jsonError(result, 500);
        if (errRes) return errRes;
        return json({ ok: true });
      },
    },
  },
});
