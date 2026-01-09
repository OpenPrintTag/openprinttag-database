import React from 'react';

import { SelectOption } from '~/components/field-types';
import { useEnum } from '~/hooks/useEnum';
import { enumToOptions, useSchemaMetadata } from '~/hooks/useSchemaMetadata';

export const useMaterialLookupData = () => {
  const { data: tagsData } = useEnum('material_tags');
  const { data: certificationsData } = useEnum('material_certifications');
  const { data: materialTypesData } = useEnum('material_types');
  const { data: metadata } = useSchemaMetadata();

  const tagsOptions = React.useMemo<SelectOption[]>(() => {
    if (!tagsData?.items) return [];
    return enumToOptions(tagsData.items, 'material_tags', metadata);
  }, [tagsData, metadata]);

  const certificationsOptions = React.useMemo<SelectOption[]>(() => {
    if (!certificationsData?.items) return [];
    return enumToOptions(
      certificationsData.items,
      'material_certifications',
      metadata,
    );
  }, [certificationsData, metadata]);

  const materialTypesOptions = React.useMemo<SelectOption[]>(() => {
    if (!materialTypesData?.items) return [];
    return enumToOptions(materialTypesData.items, 'material_types', metadata);
  }, [materialTypesData, metadata]);

  return {
    tagsOptions,
    certificationsOptions,
    materialTypesOptions,
    tagsData,
    certificationsData,
    materialTypesData,
  };
};
