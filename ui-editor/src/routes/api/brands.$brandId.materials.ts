import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import type { Material } from '~/types/material';

// GET /api/brands/$brandId/materials
export const Route = createFileRoute('/api/brands/$brandId/materials')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const brandId = params.brandId;
        console.info(`GET /api/brands/${brandId}/materials @`, request.url);
        const { readMaterialsByBrand } = await import('~/server/data/fs');
        const data = await readMaterialsByBrand(brandId, {
          validate: (obj) => !!obj && (!!obj.name || !!obj.uuid),
        });
        if (!Array.isArray(data)) {
          return json({ error: data.error }, { status: data.status ?? 500 });
        }
        const materials: Material[] = data.map(
          ({ __file, __brand, ...rest }) => rest as Material,
        );
        return json(materials);
      },
    },
  },
});
