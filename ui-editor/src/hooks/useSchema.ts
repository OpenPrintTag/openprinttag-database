import { useEffect, useMemo, useState } from 'react';

import type { EntityFields } from '~/components/fieldTypes';
import { apiUrl } from '~/utils/readOnly';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SchemaData = Record<string, JsonValue> | null;

const __schemaCache: Record<string, SchemaData> = {};
const __schemaPromises: Record<string, Promise<SchemaData> | undefined> = {};

const fetchSchemaOnce = async (entity: string): Promise<SchemaData> => {
  if (__schemaCache[entity]) return __schemaCache[entity];
  if (!__schemaPromises[entity]) {
    __schemaPromises[entity] = fetch(apiUrl(`/api/schema/${entity}`))
      .then((r) => (r.ok ? r.json() : null))
      .then((j: SchemaData) => {
        __schemaCache[entity] = j;
        return j;
      })
      .catch(() => null);
  }
  return __schemaPromises[entity] as Promise<SchemaData>;
};

export const useSchema = (
  entity: string,
): {
  schema: SchemaData;
  fields: EntityFields;
} => {
  const [schema, setSchema] = useState<SchemaData>(
    __schemaCache[entity] || null,
  );
  useEffect(() => {
    if (!__schemaCache[entity]) {
      fetchSchemaOnce(entity).then((s) => setSchema(s));
    }
  }, [entity]);

  const fields = useMemo(() => {
    if (!schema || typeof schema !== 'object') return undefined;
    return (schema as any).properties;
  }, [schema]);

  return { schema, fields };
};
