import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import {
  isValidEntityName,
  resolveSchema,
  SCHEMA_DIR_RELATIVE,
} from '~/server/schema-resolver';

export const Route = createFileRoute('/api/schema')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ request }) => {
        try {
          const fs = await import('node:fs/promises');
          const path = await import('node:path');
          const url = new URL(request.url);
          const entity = url.searchParams.get('entity');

          if (!isValidEntityName(entity)) {
            return json({ error: 'Invalid entity name' }, { status: 400 });
          }

          const schemaDir = path.resolve(process.cwd(), SCHEMA_DIR_RELATIVE);
          const schemaPath = path.join(schemaDir, `${entity}.schema.json`);

          try {
            const content = await fs.readFile(schemaPath, 'utf8');
            const data = JSON.parse(content);
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
