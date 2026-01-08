import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

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

          if (!entity) {
            return json({ error: 'Entity name is required' }, { status: 400 });
          }

          const schemaPath = path.resolve(
            process.cwd(),
            '../openprinttag/schema',
            `${entity}.schema.json`,
          );

          try {
            const content = await fs.readFile(schemaPath, 'utf8');
            const data = JSON.parse(content);
            return json(data);
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
