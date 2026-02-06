import { useMatch } from '@tanstack/react-router';
import { useMemo } from 'react';

import type { SchemaField, SelectOption } from '~/components/fieldTypes';
import {
  FIELD_ENUM_MAP,
  FIELD_RELATION_MAP,
} from '~/server/data/schema-metadata';

import { useEnum } from './useEnum';

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
  /** Whether this is a relation field (saves full object) vs enum (saves plain value) */
  isRelation: boolean;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * Unified hook for resolving field options.
 * Handles relations, enums, and inline enum values in a single call.
 * Replaces the need for separate useLookupRelation calls.
 */
export function useFieldOptions(
  fieldName: string,
  field?: SchemaField,
  brandId?: string,
): FieldOptionsResult {
  const match = useMatch({ from: '/brands/$brandId', shouldThrow: false });
  const resolvedBrandId = brandId ?? match?.params?.brandId;

  // Determine if this is an array field
  const isArray = field?.type === 'array';
  const itemField = isArray ? field?.items : field;

  const relationMeta = FIELD_RELATION_MAP[fieldName];
  const enumMeta = FIELD_ENUM_MAP[fieldName];
  const inlineEnum = itemField?.enum ?? field?.enum;

  const table = relationMeta?.entity ?? enumMeta?.entity;
  const valueField = relationMeta?.valueField ?? enumMeta?.valueField;
  const labelField = relationMeta?.labelField ?? enumMeta?.labelField;

  const variant = resolvedBrandId ? { brandId: resolvedBrandId } : undefined;
  const { data: payload, loading, error } = useEnum(table, variant);

  const options = useMemo(() => {
    // If we have a table with data, build options from it
    if (table && payload?.items) {
      const items = payload.items;

      const result: SelectOption[] = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const itemObj = item as Record<string, unknown>;
        const value = valueField ? itemObj[valueField] : null;
        if (value === undefined || value === null) continue;

        const label = labelField ? itemObj[labelField] : value;

        result.push({
          value: value as string | number,
          label: String(label),
          data: itemObj,
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
  }, [payload, table, valueField, labelField, inlineEnum]);

  const hasOptions = !!(relationMeta || enumMeta || inlineEnum);

  return {
    hasOptions,
    table,
    valueField,
    labelField,
    isArray,
    isRelation: !!relationMeta,
    options,
    loading: table ? loading : false,
    error: table ? error : null,
  };
}

export { extractValue } from '~/utils/field';
