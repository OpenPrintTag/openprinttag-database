import { DataGrid } from '~/components/DataGrid';
import { EntityFields } from '~/components/fieldTypes';

import type { Material } from '../types';

interface VisualPropertiesReadSectionProps {
  material?: Material;
  fields: EntityFields;
}

export const VisualPropertiesReadSection = ({
  material,
  fields,
}: VisualPropertiesReadSectionProps) => {
  if (
    !material?.primary_color &&
    (!material?.secondary_colors || material.secondary_colors.length === 0) &&
    !material?.transmission_distance &&
    !material?.refractive_index
  ) {
    return null;
  }

  return (
    <DataGrid
      data={material}
      title="Visual Properties"
      fields={fields}
      primaryKeys={[
        'primary_color',
        'secondary_colors',
        'transmission_distance',
        'refractive_index',
      ]}
      excludeKeys={Object.keys(fields).filter(
        (k) =>
          ![
            'primary_color',
            'secondary_colors',
            'transmission_distance',
            'refractive_index',
          ].includes(k),
      )}
      entity="material"
    />
  );
};
