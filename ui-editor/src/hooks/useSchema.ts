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

type SchemaData = Record<string, JsonValue> | null;

const __schemaCache: Record<string, SchemaData> = {};
const __schemaPromises: Record<string, Promise<SchemaData> | undefined> = {};

/** List of known enum tables */
export const DATA_ENUM_TABLES = Object.keys(ENUM_METADATA);

const normalizeType = (type?: string | string[]): string[] => {
  if (!type) return [];
  return Array.isArray(type) ? type : [type];
};

/**
 * Get the enum table for a field using explicit metadata.
 */
const getEnumTableForField = (fieldName?: string): string | null => {
  if (!fieldName) return null;
  return FIELD_ENUM_MAP[fieldName] ?? null;
};

/**
 * Get the value field for an enum table using explicit metadata.
 */
export const enumValueFieldForTable = (
  table: string | null | undefined,
): string | null => {
  if (!table) return null;
  const meta = ENUM_METADATA[table];
  return meta?.valueField ?? null;
};

/**
 * Get the label field for an enum table using explicit metadata.
 */
export const enumLabelFieldForTable = (
  table: string | null | undefined,
): string | null => {
  if (!table) return null;
  const meta = ENUM_METADATA[table];
  return meta?.labelField ?? null;
};

export const resolveEnumSource = (
  field: SchemaField | undefined,
  fieldName?: string,
): {
  isEnum: boolean;
  isArray: boolean;
  enumValues?: (string | number)[];
  table: string | null;
} => {
  const isArray = normalizeType(field?.type).includes('array');
  const enumField = (isArray ? field?.items : field) as SchemaField | undefined;
  const hasInlineEnum = Array.isArray(enumField?.enum);
  const enumValues = hasInlineEnum ? enumField?.enum : undefined;

  // Use explicit metadata instead of guessing
  const table = getEnumTableForField(fieldName);

  return {
    isEnum: hasInlineEnum || !!table,
    isArray,
    enumValues,
    table,
  };
};

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
 * Extract the best label from an item using metadata when available.
 * Falls back to common field patterns if no metadata context is provided.
 */
export const bestLabelFromItem = (it: unknown, tableName?: string): string => {
  if (!it || typeof it !== 'object') return '';
  const item = it as Record<string, unknown>;

  // Use metadata if table name is provided
  if (tableName) {
    const enumMeta = ENUM_METADATA[tableName];
    if (enumMeta) {
      return String(
        item[enumMeta.labelField] ?? item[enumMeta.valueField] ?? '',
      );
    }
  }

  // Fallback for unknown items
  return String(
    item.display_name ??
      item.name ??
      item.canonical_name ??
      item.slug ??
      item.code ??
      item.id ??
      '',
  );
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
  valueField: string | null;
  labelField: string | null;
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
      isLookup: true,
      table: enumTable,
      valueField: enumMeta?.valueField ?? 'name',
      labelField: enumMeta?.labelField ?? 'display_name',
    };
  }

  // Check for foreign_key in schema (explicit metadata)
  const fk = field.foreign_key;
  if (!fk) return null;

  const table = fk.entity;
  const valueField = fk.field || 'slug';

  // Check if this is an enum table
  const enumMeta = ENUM_METADATA[table];
  if (enumMeta) {
    return {
      isLookup: true,
      table,
      valueField: enumMeta.valueField,
      labelField: enumMeta.labelField,
    };
  }

  return {
    isLookup: true,
    table,
    valueField,
    labelField: 'name',
  };
};
