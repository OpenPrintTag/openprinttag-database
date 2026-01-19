import { useMemo } from 'react';

import { SelectOption } from '~/components/fieldTypes';
import {
  extractEntityLabel,
  extractEnumLabel,
} from '~/server/data/schema-metadata';

import { useEnum } from './useEnum';

// Entity tables that are not enums
const ENTITY_TABLES = ['brands', 'materials', 'containers', 'packages'];

export const useEnumOptions = (
  table: string | null,
  valueField: string | null,
): { loading: boolean; error: string | null; options: SelectOption[] } => {
  const { data: payload, loading, error } = useEnum(table);

  const options = useMemo(() => {
    if (!table || !valueField || !payload) {
      return [];
    }
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const isEntity = ENTITY_TABLES.includes(table);

    const opts: SelectOption[] = items
      .map((it) => {
        if (!it || typeof it !== 'object') return null;
        const item = it as Record<string, unknown>;
        const value = item[valueField];
        // Use metadata-based label extraction
        const label = isEntity
          ? extractEntityLabel(item, table)
          : extractEnumLabel(item, table);
        if (value === undefined || value === null) {
          return null;
        }
        return { value: value as string | number, label: String(label) };
      })
      .filter(Boolean) as SelectOption[];

    return opts;
  }, [payload, table, valueField]);

  return {
    loading,
    error,
    options,
  };
};
