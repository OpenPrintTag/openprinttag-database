import { useMemo } from 'react';

import { dedupeOptions, type SelectOption } from '~/utils/options';

import { useEnum } from './useEnum';
import { bestLabelFromItem } from './useSchema';

export const useEnumOptions = (
  table: string | null,
  valueField: string | null,
): { loading: boolean; error: string | null; options: SelectOption[] } => {
  const variant =
    table === 'brands' ? { variant: 'basic' as const } : undefined;
  const { data: payload, loading, error } = useEnum(table, variant);

  const options = useMemo(() => {
    if (!table || !valueField || !payload) {
      return [];
    }
    const items = Array.isArray(payload?.items) ? payload.items : [];

    const opts: SelectOption[] = items
      .map((it) => {
        if (!it || typeof it !== 'object') return null;
        const item = it as Record<string, unknown>;
        const value = item[valueField];
        const label = bestLabelFromItem(it);
        if (value === undefined || value === null) {
          return null;
        }
        return { value: value as string | number, label: String(label) };
      })
      .filter(Boolean) as SelectOption[];

    if (opts.length > 0) return dedupeOptions(opts);

    return dedupeOptions(
      items
        .map((it) => {
          if (!it || typeof it !== 'object') return null;
          const item = it as Record<string, unknown>;
          const value = item.slug ?? item.code ?? item.id;
          if (value == null) return null;
          return {
            value: value as string | number,
            label: bestLabelFromItem(it),
          };
        })
        .filter(Boolean) as SelectOption[],
    );
  }, [payload, table, valueField]);

  return {
    loading,
    error,
    options,
  };
};
