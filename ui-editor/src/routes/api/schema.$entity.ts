import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import { resolveSchema } from '~/server/schema-resolver';

export const Route = createFileRoute('/api/schema/$entity')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ params }) => {
        try {
          const fs = await import('node:fs/promises');
          const path = await import('node:path');
          const { entity } = params;

          if (!entity || !/^[a-zA-Z0-9_]+$/.test(entity)) {
            return json({ error: 'Invalid entity name' }, { status: 400 });
          }

          const schemaPath = path.resolve(
            process.cwd(),
            '../openprinttag/schema',
            `${entity}.schema.json`,
          );

          try {
            const content = await fs.readFile(schemaPath, 'utf8');
            const data = JSON.parse(content);
            const schemaDir = path.resolve(
              process.cwd(),
              '../openprinttag/schema',
            );
            let resolved;
            try {
              resolved = await resolveSchema(data, schemaDir, (p: string) =>
                fs.readFile(p, 'utf8'),
              );
            } catch (resolveErr) {
              console.warn(
                'Schema resolution failed, returning unresolved:',
                resolveErr,
              );
              resolved = data;
            }
            return json(resolved);
          } catch (_err) {
            return json(
              { error: `Schema for entity "${entity}" not found` },
              { status: 404 },
            );
          }
        } catch (_err) {
          return json({ error: 'Internal server error' }, { status: 500 });
        }
      },
    },
  },
});
