import { useApi } from './useApi';

export type EnumItem = Record<string, any>;

export type EnumTable = {
  items: EnumItem[];
  meta?: Record<string, any>;
};

export type UseEnumOptions = {
  variant?: 'default' | 'basic';
};

export function useEnum(table: string | null, options?: UseEnumOptions) {
  let url = table ? `/api/enum/${table}` : '';
  if (table === 'brands') {
    url = options?.variant === 'basic' ? '/api/brands/basic' : '/api/brands';
  }
  if (table === 'containers') url = '/api/containers';

  const { data, loading, error, refetch } = useApi<EnumTable | EnumItem[]>(
    () => url,
    undefined,
    [table, options?.variant],
  );

  // Normalize data format since /api/brands and /api/containers return arrays directly
  const normalizedData = Array.isArray(data) ? { items: data } : data;

  return {
    data: table ? (normalizedData as EnumTable | null) : null,
    loading: table ? loading : false,
    error: table ? error : null,
    refetch,
  };
}

export function useEnumList() {
  const { data, loading, error, refetch } = useApi<{ tables: string[] }>(
    '/api/enum',
  );

  return {
    tables: data?.tables ?? [],
    loading,
    error,
    refetch,
  };
}
