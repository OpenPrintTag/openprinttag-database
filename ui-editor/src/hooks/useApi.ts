import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Generic JSON-fetching hook for browser-side requests to server API routes.
 * Now powered by TanStack Query for better caching and state management.
 *
 * Usage:
 *   const { data, error, loading, refetch } = useApi<User[]>('/api/users')
 *   const { data } = useApi<User>(() => `/api/users/${id}`, undefined, [id])
 */
export function useApi<T = unknown>(
  input: string | (() => string),
  init?: RequestInit,
  deps: React.DependencyList = [],
) {
  const url = useMemo(
    () => (typeof input === 'function' ? input() : input),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input, ...deps],
  );

  const query = useQuery({
    queryKey: [url, init],
    queryFn: async ({ signal }) => {
      const res = await fetch(url, {
        ...(init || {}),
        signal,
      });

      if (!res.ok) {
        const text = await safeText(res);
        throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ''}`);
      }

      return (await res.json()) as T;
    },
    enabled: typeof window !== 'undefined' && !!url, // Only run in browser when URL is available
  });

  return {
    data: query.data ?? null,
    error: query.error ? String(query.error) : null,
    loading: query.isLoading || query.isFetching,
    refetch: query.refetch,
  };
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return '';
  }
}
