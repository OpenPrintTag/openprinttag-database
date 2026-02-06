import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

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
    },
  },
});
