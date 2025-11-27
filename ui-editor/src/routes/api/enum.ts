import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

export const Route = createFileRoute('/api/enum')({
  server: {
    middleware: [],
    handlers: {
      GET: async () => {
        const { listLookupTables } = await import('~/server/data/fs');
        const res = await listLookupTables();
        if (!Array.isArray(res)) {
          const err = res as any;
          return json({ error: err.error }, { status: err.status ?? 500 });
        }
        return json({ tables: res });
      },
    },
  },
});
