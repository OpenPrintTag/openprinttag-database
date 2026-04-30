import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import { FIELD_RELATION_MAP } from '~/server/data/schema-metadata';

/**
 * Enrich schema properties with entity metadata from FIELD_RELATION_MAP.
 * Adds the `entity` property to fields that have relation metadata, which is
 * needed for proper display in ValueDisplay component.
 */
function enrichSchemaWithEntityMetadata(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;

  const enriched = { ...schema };

  if (enriched.properties && typeof enriched.properties === 'object') {
    const enrichedProperties: Record<string, any> = {};

    for (const [fieldName, fieldSchema] of Object.entries(
      enriched.properties,
    )) {
      const relation = FIELD_RELATION_MAP[fieldName];
      if (relation && typeof fieldSchema === 'object' && fieldSchema !== null) {
        const entityName = relation.entity.replace(/s$/, '');
        enrichedProperties[fieldName] = {
          ...(fieldSchema as object),
          entity: entityName,
        };
      } else {
        enrichedProperties[fieldName] = fieldSchema;
      }
    }

    enriched.properties = enrichedProperties;
  }

  return enriched;
}

export const Route = createFileRoute('/api/schema/$entity')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ params }) => {
        try {
          const fs = await import('node:fs/promises');
          const path = await import('node:path');
          const { entity } = params;

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
            const enrichedData = enrichSchemaWithEntityMetadata(data);
            return json(enrichedData);
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
