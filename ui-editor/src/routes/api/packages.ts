import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

export const Route = createFileRoute('/api/packages')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ request }) => {
        console.info('GET /api/packages @', request.url);
        const { readAllNestedAcrossBrands } = await import('~/server/data/fs');
        const data = await readAllNestedAcrossBrands('material-packages', {
          validate: (obj) => !!obj && (!!obj.slug || !!obj.uuid || !!obj.name),
        });
        if (!Array.isArray(data)) {
          return json({ error: data.error }, { status: data.status ?? 500 });
        }
        return json(
          data.map(({ __file, __brand, ...r }) => ({ ...r, brandId: __brand })),
        );
      },
    },
  },
});
