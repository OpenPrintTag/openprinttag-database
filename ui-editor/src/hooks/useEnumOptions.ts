import { useQuery } from '@tanstack/react-query';

import { bestLabelFromItem } from './useSchema';

type Option = { value: string | number; label: string };

export const useEnumOptions = (
  table: string | null,
  valueField: string | null,
): { loading: boolean; error: string | null; options: Option[] } => {
  const cacheKey = table ? `${table}::${valueField ?? ''}` : '';

  const query = useQuery({
    queryKey: [`/api/enum/${table}`, cacheKey],
    queryFn: async () => {
      if (!table || !valueField) {
        return [];
      }

      const res = await fetch(`/api/enum/${table}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const payload = (await res.json()) as { items?: unknown[] };
      const items = Array.isArray(payload?.items) ? payload.items : [];

      const opts: Option[] = items
        .map((it) => {
          if (!it || typeof it !== 'object') return null;
          const item = it as Record<string, unknown>;
          const value = item[valueField];
          const label = bestLabelFromItem(it);
          if (value === undefined || value === null) return null;
          return { value: value as string | number, label: String(label) };
        })
        .filter(Boolean) as Option[];

      const finalOpts =
        opts.length > 0
          ? opts
          : (items
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
              .filter(Boolean) as Option[]);

      return finalOpts;
    },
    enabled: !!table && !!valueField && typeof window !== 'undefined',
  });

  return {
    loading: query.isLoading || query.isFetching,
    error: query.error ? String(query.error) : null,
    options: query.data ?? [],
  };
};
