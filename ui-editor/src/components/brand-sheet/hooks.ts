import React from 'react';

import { useApi } from '~/hooks/useApi';

import type { LookupData, SelectOption } from './types';

export const useBrandLookupData = () => {
  const { data: countriesData } = useApi<LookupData>(
    '/api/enum/countries',
    undefined,
    [],
  );

  const countriesOptions = React.useMemo<SelectOption[]>(() => {
    if (!countriesData?.items) return [];
    return countriesData.items.map((item) => ({
      value: String(item.code || item.id),
      label: String(item.name || item.code || item.id),
    }));
  }, [countriesData]);

  return {
    countriesOptions,
  };
};
