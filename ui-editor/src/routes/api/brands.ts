import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import type { Brand } from '~/types/brand';

export const Route = createFileRoute('/api/brands')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ request }) => {
        console.info('GET /api/brands @', request.url);
        // Avoid importing Node modules in the client bundle: dynamic import inside handler
        const { readAllEntities } = await import('~/server/data/fs');
        const data = await readAllEntities('brands', {
          validate: (obj) => !!obj && (!!obj.name || !!obj.uuid),
        });
        if (!Array.isArray(data)) {
          return json({ error: data.error }, { status: data.status ?? 500 });
        }
        // strip helper meta like __file
        const brands: Brand[] = data.map(
          ({ __file, ...rest }) => rest as Brand,
        );
        return json(brands);
      },
    },
  },
});
