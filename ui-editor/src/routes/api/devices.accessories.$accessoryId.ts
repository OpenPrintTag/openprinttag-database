import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

export const Route = createFileRoute('/api/devices/accessories/$accessoryId')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ params, request }) => {
        console.info(
          'GET /api/devices/accessories/:accessoryId @',
          request.url,
        );
        const { readSingleEntity } = await import('~/server/data/fs');
        const data = await readSingleEntity(
          'devices/accessories',
          params.accessoryId,
        );
        if ('error' in (data as { error?: string; status?: number })) {
          const err = data as any;
          return json({ error: err.error }, { status: err.status ?? 500 });
        }
        return json(data);
      },
    },
  },
});
