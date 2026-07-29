import { DataGrid } from '~/components/DataGrid';
import { EntityFields } from '~/components/fieldTypes';
import { useClassFields } from '~/hooks/useClassFields';

import type { Material } from '../types';

const VISUAL_KEYS = [
  'primary_color',
  'secondary_colors',
  'transmission_distance',
  'refractive_index',
];

interface VisualPropertiesReadSectionProps {
  material?: Material;
  fields: EntityFields;
}

export const VisualPropertiesReadSection = ({
  material,
  fields,
}: VisualPropertiesReadSectionProps) => {
  const filteredFields = useClassFields(fields, material?.class);

  if (!filteredFields || !material) {
    return null;
  }

  const activeVisualKeys = VISUAL_KEYS.filter((k) => k in filteredFields);

  const hasVisualData = activeVisualKeys.some((key) => {
    const value = material?.[key];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null;
  });

  if (!hasVisualData) {
    return null;
  }

  return (
    <DataGrid
      data={material}
      title="Visual Properties"
      fields={filteredFields}
      primaryKeys={activeVisualKeys}
      excludeKeys={Object.keys(filteredFields).filter(
        (k) => !activeVisualKeys.includes(k),
      )}
    />
  );
};
