import fs from 'node:fs/promises';
import path from 'node:path';

import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

export const Route = createFileRoute('/api/enum/$table')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ params, request }) => {
        console.info('GET /api/enum/:table @', request.url);
        if (params.table === 'countries') {
          const filePath = path.join(process.cwd(), '../data/countries.json');
          try {
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            const items = Object.entries(data).map(([key, name]) => ({
              key,
              name,
            }));
            return json({ items, meta: { key: 'items' } });
          } catch (err) {
            return json({ error: String(err) }, { status: 500 });
          }
        }
        const { readLookupTable } = await import('~/server/data/fs');
        const data = await readLookupTable(params.table);
        if ('error' in (data as { error?: string; status?: number })) {
          const err = data as any;
          return json({ error: err.error }, { status: err.status ?? 500 });
        }
        return json(data);
      },
    },
  },
});
