import { useEffect, useMemo, useState } from 'react';

import type { EntityFields, SchemaField } from '~/components/field-types';

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

export const DATA_ENUM_TABLES = [
  'material_certifications',
  'material_tags',
  'material_types',
  'material_tag_categories',
  'material_photo_types',
  'brand_link_pattern_types',
  'countries',
];

const normalizeType = (type?: string | string[]): string[] => {
  if (!type) return [];
  return Array.isArray(type) ? type : [type];
};

const guessEnumTable = (
  field: SchemaField | undefined,
  fieldName?: string,
): string | null => {
  const label = (fieldName || field?.title || '').toLowerCase();
  if (!label) return null;

  if (label.includes('tag')) return 'material_tags';
  if (label.includes('certification')) return 'material_certifications';
  if (label === 'type' || label.includes('material type'))
    return 'material_types';
  if (label.includes('photo') && label.includes('type'))
    return 'material_photo_types';
  if (label.includes('link') && label.includes('pattern'))
    return 'brand_link_pattern_types';
  if (label.includes('country')) return 'countries';
  return null;
};

export const enumValueFieldForTable = (
  table: string | null | undefined,
): string | null => {
  if (!table) return null;
  if (table === 'material_types' || table === 'countries') return 'key';
  return 'name';
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

  let table = guessEnumTable(enumField ?? field, fieldName);
  if (enumField?.title && !table) {
    table = guessEnumTable(enumField, enumField.title);
  }
  if (table && !DATA_ENUM_TABLES.includes(table)) {
    table = null;
  }

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

// No ForeignKey type needed anymore as we use SchemaField directly

const resolveSchemaRef = (
  field: SchemaField,
): { entity: string; field: string } | null => {
  if (field.$ref === 'slug_reference.schema.json')
    return { entity: '', field: 'slug' };
  if (field.$ref === 'uuid_reference.schema.json')
    return { entity: '', field: 'uuid' };
  if (field.$ref === 'brand.schema.json')
    return { entity: 'brand', field: 'slug' };
  if (field.$ref === 'material.schema.json')
    return { entity: 'material', field: 'slug' };
  if (field.$ref === 'material_container.schema.json')
    return { entity: 'material_container', field: 'slug' };
  if (field.$ref === 'fff_material_container.schema.json')
    return { entity: 'fff_material_container', field: 'slug' };
  if (field.$ref === 'sla_material_container.schema.json')
    return { entity: 'sla_material_container', field: 'slug' };
  if (field.$ref === 'material_color.schema.json')
    return { entity: 'colors', field: 'slug' };
  return null;
};

export const useLookupRelation = (
  entity: string,
  field: SchemaField | undefined,
  fieldName?: string,
): {
  isLookup: boolean;
  table: string | null;
  valueField: string | null;
} | null => {
  if (!field) return null;

  let fk = field.foreign_key;

  // Try to resolve from oneOf (common pattern in our schemas for references)
  if (!fk && field.oneOf) {
    for (const option of field.oneOf) {
      const resolved = resolveSchemaRef(option);
      if (resolved) {
        if (resolved.entity) {
          fk = resolved;
          break;
        } else if (resolved.field) {
          // If we found a slug/uuid ref but don't have an entity yet, keep looking for the entity ref in the same oneOf
          const entityRef = field.oneOf.find(
            (opt) => opt.$ref && !opt.$ref.includes('reference'),
          );
          if (entityRef) {
            const resolvedEntity = resolveSchemaRef(entityRef);
            if (resolvedEntity) {
              fk = { entity: resolvedEntity.entity, field: resolved.field };
              break;
            }
          }
        }
      }
    }
  }

  if (!fk) {
    // Fallback for fields that are known lookups but not explicitly marked in schema yet
    const label = (fieldName || field.title || '').toLowerCase();
    if (label === 'countries_of_origin')
      return { isLookup: true, table: 'countries', valueField: 'key' };
    if (label === 'tags')
      return { isLookup: true, table: 'material_tags', valueField: 'name' };
    if (label === 'certifications')
      return {
        isLookup: true,
        table: 'material_certifications',
        valueField: 'name',
      };
    if (label === 'type')
      return { isLookup: true, table: 'material_types', valueField: 'key' };
    return null;
  }

  let table = fk.entity;
  let valueField = fk.field || 'slug';

  // Map entity names to table names if they differ
  if (table === 'brand') table = 'brands';
  if (table === 'material') table = 'materials';
  if (table === 'material_container') table = 'containers';
  if (table === 'fff_material_container') table = 'containers';
  if (table === 'sla_material_container') table = 'containers';
  if (table === 'material_package') table = 'packages';
  if (table === 'fff_material_package') table = 'packages';
  if (table === 'sla_material_package') table = 'packages';

  // Special case for countries
  if (table === 'countries_of_origin') {
    table = 'countries';
  }

  // Handle enums that are in the new openprinttag/data folder
  if (DATA_ENUM_TABLES.includes(table)) {
    valueField = enumValueFieldForTable(table) ?? valueField;
  }

  return {
    isLookup: true,
    table,
    valueField,
  };
};
