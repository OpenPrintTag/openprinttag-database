import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import { Material } from '~/components/material-sheet';

export const Route = createFileRoute('/api/materials')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ request }) => {
        console.info('GET /api/materials @', request.url);
        // Use nested materials across brands so we can include brand identifier
        const { readAllMaterialsAcrossBrands } =
          await import('~/server/data/fs');
        const data = await readAllMaterialsAcrossBrands({
          validate: (obj) => !!obj && (!!obj.name || !!obj.uuid),
        });
        if (!Array.isArray(data)) {
          return json({ error: data.error }, { status: data.status ?? 500 });
        }
        const materials: Material[] = data.map(
          ({ __file, __brand, ...rest }) => ({
            ...(rest as Material),
            // expose brand identifier to build links
            brandId: __brand as any,
          }),
        );
        return json(materials);
      },
    },
  },
});
