import { useMemo } from 'react';

import { useEnum } from './useEnum';
import { bestLabelFromItem } from './useSchema';

type Option = { value: string | number; label: string };

export const useEnumOptions = (
  table: string | null,
  valueField: string | null,
): { loading: boolean; error: string | null; options: Option[] } => {
  const variant =
    table === 'brands' ? { variant: 'basic' as const } : undefined;
  const { data: payload, loading, error } = useEnum(table, variant);

  const options = useMemo(() => {
    if (!table || !valueField || !payload) {
      return [];
    }
    const items = Array.isArray(payload?.items) ? payload.items : [];

    const opts: Option[] = items
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
      .filter(Boolean) as Option[];

    if (opts.length > 0) return opts;

    return items
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
      .filter(Boolean) as Option[];
  }, [payload, table, valueField]);

  return {
    loading,
    error,
    options,
  };
};
