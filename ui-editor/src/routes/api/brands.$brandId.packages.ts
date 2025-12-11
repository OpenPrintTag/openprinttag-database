import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

export const Route = createFileRoute('/api/brands/$brandId/packages')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ params, request }) => {
        console.info('GET /api/brands/:brandId/packages @', request.url);
        const { readNestedEntitiesByBrand } = await import('~/server/data/fs');
        const data = await readNestedEntitiesByBrand(
          'material-packages',
          params.brandId,
          {
            validate: (obj) =>
              !!obj && (!!obj.slug || !!obj.uuid || !!obj.name),
          },
        );
        if (!Array.isArray(data)) {
          return json(
            { error: (data as { error?: string; status?: number }).error },
            {
              status:
                (data as { error?: string; status?: number }).status ?? 500,
            },
          );
        }
        return json(data.map(({ __file, __brand, ...r }) => r));
      },
    },
  },
});
