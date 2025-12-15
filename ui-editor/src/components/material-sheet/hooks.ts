import React from 'react';

import { useApi } from '~/hooks/useApi';

import type { LookupData, SelectOption } from './types';

export const useMaterialLookupData = () => {
  const { data: tagsData } = useApi<LookupData>(
    '/api/enum/material-tags',
    undefined,
    [],
  );
  const { data: certificationsData } = useApi<LookupData>(
    '/api/enum/material-certifications',
    undefined,
    [],
  );
  const { data: materialTypesData } = useApi<LookupData>(
    '/api/enum/material-types',
    undefined,
    [],
  );

  const tagsOptions = React.useMemo<SelectOption[]>(() => {
    if (!tagsData?.items) return [];
    return tagsData.items.map((item) => ({
      value: String(item.slug || item.id),
      label: String(item.name || item.slug || item.id),
    }));
  }, [tagsData]);

  const certificationsOptions = React.useMemo<SelectOption[]>(() => {
    if (!certificationsData?.items) return [];
    return certificationsData.items.map((item) => ({
      value: String(item.slug || item.id),
      label: String(item.name || item.slug || item.id),
    }));
  }, [certificationsData]);

  const materialTypesOptions = React.useMemo<SelectOption[]>(() => {
    if (!materialTypesData?.items) return [];
    return materialTypesData.items.map((item) => ({
      value: String(item.id),
      label: String(item.name || item.abbreviation || item.id),
    }));
  }, [materialTypesData]);

  return {
    tagsOptions,
    certificationsOptions,
    materialTypesOptions,
  };
};

export const classOptions = [
  { value: 'FFF', label: 'FFF' },
  { value: 'SLA', label: 'SLA' },
];
