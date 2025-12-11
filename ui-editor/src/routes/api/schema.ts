import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

export const Route = createFileRoute('/api/schema')({
  server: {
    middleware: [],
    handlers: {
      GET: async () => {
        try {
          const fs = await import('node:fs/promises');
          const path = await import('node:path');
          const yamlMod = (await import('yaml').catch(
            () => null as any,
          )) as any;
          // Try multiple candidate locations to be robust regardless of cwd
          const candidates = [
            path.resolve(process.cwd(), 'schema.yaml'),
            path.resolve(process.cwd(), '..', 'schema.yaml'),
          ];

          let content: string | null = null;
          for (const p of candidates) {
            try {
              content = await fs.readFile(p, 'utf8');
              break;
            } catch {
              // try next
            }
          }
          if (!content) {
            return json({ error: 'Schema not found' }, { status: 404 });
          }
          const data =
            yamlMod && typeof yamlMod.parse === 'function'
              ? yamlMod.parse(content)
              : null;
          if (!data) {
            return json({ error: 'Failed to parse schema' }, { status: 500 });
          }
          return json(data);
        } catch (_err) {
          return json({ error: 'Schema not found' }, { status: 404 });
        }
      },
    },
  },
});
