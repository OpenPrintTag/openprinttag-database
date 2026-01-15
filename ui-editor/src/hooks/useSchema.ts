import { useEffect, useMemo, useState } from 'react';

import type { EntityFields, SchemaField } from '~/components/field-types';
import {
  ENUM_METADATA,
  FIELD_ENUM_MAP,
  FIELD_RELATION_MAP,
} from '~/server/data/schema-metadata';

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
    __schemaPromises[entity] = fetch(`/api/schema?entity=${entity}`)
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

/**
 * Look up relation metadata for a field.
 * Uses explicit metadata from FIELD_RELATION_MAP and FIELD_ENUM_MAP.
 * No longer relies on oneOf/$ref parsing from JSON schemas.
 */
export const useLookupRelation = (
  _entity: string,
  field: SchemaField | undefined,
  fieldName?: string,
): {
  isLookup: boolean;
  table: string | null;
  valueField: string;
  labelField: string;
} | null => {
  if (!field) return null;

  // Check if this field has explicit relation metadata
  if (fieldName && FIELD_RELATION_MAP[fieldName]) {
    const rel = FIELD_RELATION_MAP[fieldName];
    return {
      isLookup: true,
      table: rel.entity,
      valueField: rel.valueField,
      labelField: rel.labelField,
    };
  }

  // Check if this is an enum field
  if (fieldName && FIELD_ENUM_MAP[fieldName]) {
    const enumTable = FIELD_ENUM_MAP[fieldName];
    const enumMeta = ENUM_METADATA[enumTable];
    return {
      isLookup: false,
      table: enumTable,
      valueField: enumMeta?.valueField ?? 'name',
      labelField: enumMeta?.labelField ?? 'display_name',
    };
  }

  return null;
};
