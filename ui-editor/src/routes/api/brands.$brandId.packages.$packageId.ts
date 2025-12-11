import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

export const Route = createFileRoute(
  '/api/brands/$brandId/packages/$packageId',
)({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ params, request }) => {
        console.info(
          'GET /api/brands/:brandId/packages/:packageId @',
          request.url,
        );
        const { readSingleNestedByBrand } = await import('~/server/data/fs');
        const data = await readSingleNestedByBrand(
          'material-packages',
          params.brandId,
          params.packageId,
        );
        if ('error' in (data as { error?: string; status?: number })) {
          const err = data as any;
          return json({ error: err.error }, { status: err.status ?? 500 });
        }
        return json(data);
      },
      PUT: async ({ params, request }) => {
        console.info(
          'PUT /api/brands/:brandId/packages/:packageId @',
          request.url,
        );
        try {
          const payload = await request.json();
          const { writeNestedByBrand } = await import('~/server/data/fs');
          const result = await writeNestedByBrand(
            'material-packages',
            params.brandId,
            params.packageId,
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
