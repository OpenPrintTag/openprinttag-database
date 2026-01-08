import React from 'react';

import { useEnum } from '~/hooks/useEnum';

import type { SelectOption } from './types';

export const useMaterialLookupData = () => {
  const { data: tagsData } = useEnum('material_tags');
  const { data: certificationsData } = useEnum('material_certifications');
  const { data: materialTypesData } = useEnum('material_types');

  const tagsOptions = React.useMemo<SelectOption[]>(() => {
    if (!tagsData?.items) return [];
    return tagsData.items.map((item) => ({
      value: String(item.slug || item.key || item.name),
      label: String(item.name || item.slug || item.key),
    }));
  }, [tagsData]);

  const certificationsOptions = React.useMemo<SelectOption[]>(() => {
    if (!certificationsData?.items) return [];
    return certificationsData.items.map((item) => ({
      value: String(item.display_name || item.key || item.name),
      label: String(item.name || item.display_name || item.key),
    }));
  }, [certificationsData]);

  const materialTypesOptions = React.useMemo<SelectOption[]>(() => {
    if (!materialTypesData?.items) return [];
    return materialTypesData.items.map((item) => ({
      value: String(item.key),
      label: String(item.name || item.abbreviation || item.key),
    }));
  }, [materialTypesData]);

  return {
    tagsOptions,
    certificationsOptions,
    materialTypesOptions,
    tagsData,
    certificationsData,
    materialTypesData,
  };
};

export const classOptions = [
  { value: 'FFF', label: 'FFF' },
  { value: 'SLA', label: 'SLA' },
];
