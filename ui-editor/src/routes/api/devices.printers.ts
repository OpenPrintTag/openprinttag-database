import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

export const Route = createFileRoute('/api/devices/printers')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ request }) => {
        console.info('GET /api/devices/printers @', request.url);
        const { readAllEntities } = await import('~/server/data/fs');
        const data = await readAllEntities('devices/printers', {
          validate: (obj) => !!obj && (!!obj.slug || !!obj.uuid || !!obj.name),
        });
        if (!Array.isArray(data)) {
          return json(
            { error: (data as { error?: string; status?: number }).error },
            {
              status:
                (data as { error?: string; status?: number }).status ?? 500,
            },
          );
        }
        return json(data.map(({ __file, ...r }) => r));
      },
    },
  },
});
