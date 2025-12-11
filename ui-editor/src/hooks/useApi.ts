import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Generic JSON-fetching hook for browser-side requests to server API routes.
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
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);

  const url = useMemo(
    () => (typeof input === 'function' ? input() : input),
    deps,
  );

  const doFetch = useCallback(async () => {
    if (typeof window === 'undefined') {
      // SSR: do nothing, keep initial state
      return;
    }
    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        ...(init || {}),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await safeText(res);
        throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ''}`);
      }
      const json = (await res.json()) as T;
      setData(json);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [url, init]);

  useEffect(() => {
    doFetch();
    return () => {
      abortRef.current?.abort();
    };
  }, [doFetch]);

  const refetch = useCallback(() => {
    doFetch();
  }, [doFetch]);

  return { data, error, loading, refetch };
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return '';
  }
}
