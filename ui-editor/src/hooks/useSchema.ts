import { useEffect, useState } from 'react';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type SchemaEntity = Record<string, JsonValue> & {
  type?: string;
  file?: string;
  fields?: Record<string, JsonValue>;
};

type SchemaData =
  | (Record<string, JsonValue> & {
      entities?: Record<string, SchemaEntity>;
    })
  | null;

let __schemaData: SchemaData | null = null;
let __schemaPromise: Promise<SchemaData | null> | null = null;

const fetchSchemaOnce = async (): Promise<SchemaData | null> => {
  if (__schemaData) return __schemaData;
  if (!__schemaPromise) {
    __schemaPromise = fetch('/api/schema')
      .then((r) => (r.ok ? r.json() : null))
      .then((j: SchemaData) => {
        __schemaData = j;
        return j;
      })
      .catch(() => null);
  }
  return __schemaPromise;
};

export const useSchema = (): SchemaData | null => {
  const [schema, setSchema] = useState<SchemaData | null>(__schemaData);
  useEffect(() => {
    if (!__schemaData) {
      fetchSchemaOnce().then((s) => setSchema(s));
    }
  }, []);
  return schema;
};

export const stripYamlExt = (file: string | undefined): string | null => {
  if (!file) return null;
  return file.replace(/\.(ya?ml)$/i, '');
};

type ItemWithLabel = {
  display_name?: string;
  name?: string;
  canonical_name?: string;
  slug?: string;
  code?: string;
  id?: string | number;
};

export const bestLabelFromItem = (it: unknown): string => {
  if (!it || typeof it !== 'object') return '';
  const item = it as ItemWithLabel;
  return (
    item.display_name ??
    item.name ??
    item.canonical_name ??
    item.slug ??
    item.code ??
    String(item.id ?? '')
  );
};

type ForeignKey = { entity: string; field: string } | undefined;

export const useLookupRelation = (
  fk: ForeignKey,
): {
  isLookup: boolean;
  table: string | null;
  valueField: string | null;
} | null => {
  const schema = useSchema();
  if (!fk) return null;
  const ent = (schema?.entities ?? {})[fk.entity];
  if (!ent || ent?.type !== 'lookup_table')
    return { isLookup: false, table: null, valueField: null };
  const table = stripYamlExt(ent?.file);
  return { isLookup: true, table, valueField: fk.field || null };
};
