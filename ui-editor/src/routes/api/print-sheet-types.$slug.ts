import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

export const Route = createFileRoute('/api/print-sheet-types/$slug')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ params, request }) => {
        console.info('GET /api/print-sheet-types/:slug @', request.url);
        const { readSingleEntity } = await import('~/server/data/fs');
        const res = await readSingleEntity('print-sheet-types', params.slug);
        if ((res as any)?.error) {
          const err = res as any;
          return json({ error: err.error }, { status: err.status ?? 404 });
        }
        return json(res);
      },
      PUT: async ({ params, request }) => {
        console.info('PUT /api/print-sheet-types/:slug @', request.url);
        try {
          const payload = await request.json();
          const { writeSingleEntity } = await import('~/server/data/fs');
          const result = await writeSingleEntity(
            'print-sheet-types',
            params.slug,
            payload,
          );
          if ((result as { error?: string; status?: number })?.error) {
            const err = result as any;
            return json({ error: err.error }, { status: err.status ?? 500 });
          }
          return json({ ok: true });
        } catch (_err: any) {
          return json({ error: 'Invalid request body' }, { status: 400 });
        }
      },
    },
  },
});
