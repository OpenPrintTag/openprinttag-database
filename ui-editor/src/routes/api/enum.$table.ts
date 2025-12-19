import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import {
  createLookupTableItem as createItem,
  jsonError,
  parseJsonSafe,
} from '~/server/http';

export const Route = createFileRoute('/api/enum/$table')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ params, request }) => {
        console.info('GET /api/enum/:table @', request.url);
        const { readLookupTable } = await import('~/server/data/fs');
        const data = await readLookupTable(params.table);
        if ('error' in (data as { error?: string; status?: number })) {
          const err = data as any;
          return json({ error: err.error }, { status: err.status ?? 500 });
        }
        return json(data);
      },
      POST: async ({ params, request }) => {
        console.info('POST /api/enum/:table @', request.url);
        const body = await parseJsonSafe(request);
        if (!body.ok) return body.response;
        const result = await createItem(params.table, body.value);
        const errRes = jsonError(result, 500);
        if (errRes) return errRes;
        return json(result);
      },
    },
  },
});
