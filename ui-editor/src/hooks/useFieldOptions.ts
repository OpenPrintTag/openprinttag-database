import { useMemo } from 'react';

import type { SchemaField, SelectOption } from '~/components/field-types';
import {
  ENUM_METADATA,
  extractEntityLabel,
  extractEnumLabel,
  FIELD_ENUM_MAP,
  FIELD_RELATION_MAP,
} from '~/server/data/schema-metadata';

import { useEnum } from './useEnum';

// Entity tables that are not enums
const ENTITY_TABLES = ['brands', 'materials', 'containers', 'packages'];

export interface FieldOptionsResult {
  /** Whether this field has options (is a lookup/enum field) */
  hasOptions: boolean;
  /** The resolved table/entity name */
  table: string | null;
  /** The field used for values */
  valueField: string | null;
  /** The field used for labels */
  labelField: string | null;
  /** Whether this is an array field */
  isArray: boolean;
  /** The options for select/multiselect */
  options: SelectOption[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * Unified hook for resolving field options.
 * Handles relations, enums, and inline enum values in a single call.
 * Replaces the need for separate useLookupRelation + useEnumOptions calls.
 */
export function useFieldOptions(
  fieldName: string,
  field: SchemaField | undefined,
): FieldOptionsResult {
  // Determine if this is an array field
  const isArray = field?.type === 'array';
  const itemField = isArray ? field?.items : field;

  // Check for explicit relation mapping first
  const relationMeta = FIELD_RELATION_MAP[fieldName];

  // Check for explicit enum mapping
  const enumTable = FIELD_ENUM_MAP[fieldName];

  // Check for inline enum values
  const inlineEnum = itemField?.enum ?? field?.enum;

  // Determine the table to fetch from
  let table: string | null = null;
  let valueField: string | null = null;
  let labelField: string | null = null;

  if (relationMeta) {
    table = relationMeta.entity;
    valueField = relationMeta.valueField;
    labelField = relationMeta.labelField;
  } else if (enumTable) {
    table = enumTable;
    const enumMeta = ENUM_METADATA[enumTable];
    valueField = enumMeta?.valueField ?? 'name';
    labelField = enumMeta?.labelField ?? 'display_name';
  }

  // Fetch data from the table
  const variant =
    table === 'brands' ? { variant: 'basic' as const } : undefined;
  const { data: payload, loading, error } = useEnum(table, variant);

  // Build options
  const options = useMemo(() => {
    // If we have inline enum values and no table, use those
    if (inlineEnum && !table) {
      return inlineEnum.map((v) => ({
        value: String(v),
        label: String(v),
      }));
    }

    // If we have a table with data, build options from it
    if (table && payload?.items) {
      const items = payload.items;
      const isEntity = ENTITY_TABLES.includes(table);

      const result: SelectOption[] = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const itemObj = item as Record<string, unknown>;
        const value = valueField ? itemObj[valueField] : null;
        if (value === undefined || value === null) continue;

        const label = isEntity
          ? extractEntityLabel(itemObj, table)
          : extractEnumLabel(itemObj, table);

        result.push({
          value: value as string | number,
          label: String(label),
          data: isEntity ? itemObj : undefined,
        });
      }
      return result;
    }

    // If we have inline enum values as fallback
    if (inlineEnum) {
      return inlineEnum.map((v) => ({
        value: String(v),
        label: String(v),
      }));
    }

    return [];
  }, [payload, table, valueField, inlineEnum]);

  const hasOptions = !!(relationMeta || enumTable || inlineEnum);

  return {
    hasOptions,
    table,
    valueField,
    labelField,
    isArray,
    options,
    loading: table ? loading : false,
    error: table ? error : null,
  };
}

// Re-export extractValue from utils for backwards compatibility
export { extractValue } from '~/utils/field';
