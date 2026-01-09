import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

export const Route = createFileRoute('/api/schema-metadata')({
  server: {
    middleware: [],
    handlers: {
      GET: async () => {
        try {
          const {
            ENUM_METADATA,
            ENTITY_METADATA,
            FIELD_ENUM_MAP,
            FIELD_RELATION_MAP,
          } = await import('~/server/data/schema-metadata');

          return json({
            enums: ENUM_METADATA,
            entities: ENTITY_METADATA,
            fieldEnumMap: FIELD_ENUM_MAP,
            fieldRelationMap: FIELD_RELATION_MAP,
          });
        } catch (_err) {
          return json({ error: 'Internal server error' }, { status: 500 });
        }
      },
    },
  },
});
