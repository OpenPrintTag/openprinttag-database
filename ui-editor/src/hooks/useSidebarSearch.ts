import { useLocation } from '@tanstack/react-router';
import React from 'react';

function setUrlParam(param: string, value: string) {
  try {
    const url = new URL(window.location.href);
    const current = url.searchParams.get(param) ?? '';
    const next = value ?? '';
    // If nothing actually changes, bail early to avoid redundant history updates
    if (current === next) return;

    if (next) {
      url.searchParams.set(param, next);
    } else {
      url.searchParams.delete(param);
    }

    const nextHref = url.toString();
    if (nextHref !== window.location.href) {
      window.history.replaceState({}, '', nextHref);
    }
  } catch {
    // ignore in non-browser
  }
}

export function useSidebarSearch(param: string = 'q', initial: string = '') {
  const location = useLocation();
  const initialFromUrl = React.useMemo(() => {
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get(param) ?? initial;
    } catch {
      return initial;
    }
  }, [param]);

  const [query, setQuery] = React.useState<string>(initialFromUrl);
  const [debounced, setDebounced] = React.useState<string>(initialFromUrl);

  // When URL changes externally (navigation), update local state
  React.useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const q = url.searchParams.get(param) ?? '';
      setQuery((prev) => (prev !== q ? q : prev));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.searchStr]);

  // Debounce
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(id);
  }, [query]);

  // Reflect in URL
  React.useEffect(() => {
    setUrlParam(param, query.trim());
  }, [param, query]);

  return {
    query,
    setQuery,
    debounced,
  };
}

export default useSidebarSearch;
