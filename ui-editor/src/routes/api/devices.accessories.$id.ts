import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

export const Route = createFileRoute('/api/devices/accessories/$id')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ params, request }) => {
        console.info('GET /api/devices/accessories/:id @', request.url);
        const { readSingleEntity } = await import('~/server/data/fs');
        const res = await readSingleEntity('devices/accessories', params.id);
        if ((res as any)?.error) {
          const err = res as any;
          return json({ error: err.error }, { status: err.status ?? 404 });
        }
        return json(res);
      },
      PUT: async ({ params, request }) => {
        console.info('PUT /api/devices/accessories/:id @', request.url);
        try {
          const payload = await request.json();
          const { writeSingleEntity } = await import('~/server/data/fs');
          const result = await writeSingleEntity(
            'devices/accessories',
            params.id,
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
