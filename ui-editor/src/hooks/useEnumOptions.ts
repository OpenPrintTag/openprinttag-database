import { useEffect, useState } from 'react';

import { bestLabelFromItem } from './useSchema';

type Option = { value: string | number; label: string };
const __enumCache: Map<string, { options: Option[] }> = new Map();

export const useEnumOptions = (
  table: string | null,
  valueField: string | null,
): { loading: boolean; error: string | null; options: Option[] } => {
  const cacheKey = table ? `${table}::${valueField ?? ''}` : '';
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    options: Option[];
  }>(() => {
    if (cacheKey && __enumCache.has(cacheKey)) {
      return {
        loading: false,
        error: null,
        options: __enumCache.get(cacheKey)!.options,
      };
    }
    return { loading: !!table, error: null, options: [] };
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!table || !valueField) {
        setState({ loading: false, error: null, options: [] });
        return;
      }
      if (__enumCache.has(cacheKey)) {
        const cached = __enumCache.get(cacheKey)!;
        setState({ loading: false, error: null, options: cached.options });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
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
        __enumCache.set(cacheKey, { options: finalOpts });
        if (!cancelled)
          setState({ loading: false, error: null, options: finalOpts });
      } catch (err: unknown) {
        if (!cancelled)
          setState({
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load',
            options: [],
          });
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, table, valueField]);

  return state;
};
