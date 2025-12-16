import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import type { Brand } from '~/types/brand';

export const Route = createFileRoute('/api/brands/basic')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ request }) => {
        console.info('GET /api/brands/basic @', request.url);

        const { readAllEntities } = await import('~/server/data/fs');

        const data = await readAllEntities('brands', {
          validate: (obj) => !!obj && (!!obj.name || !!obj.uuid),
        });

        if (!Array.isArray(data)) {
          return json({ error: data.error }, { status: data.status ?? 500 });
        }

        // Return brands without counts for fast initial load
        const brands: Brand[] = data.map(({ __file, ...brand }) => ({
          ...brand,
          material_count: undefined,
          package_count: undefined,
        })) as Brand[];

        return json(brands);
      },
    },
  },
});
