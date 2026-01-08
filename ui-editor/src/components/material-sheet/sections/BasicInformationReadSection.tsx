import { DataGrid } from '~/components/DataGrid';
import type { SchemaField } from '~/components/field-types';

import type { Material } from '../types';

interface BasicInformationReadSectionProps {
  material?: Material;
  fields: Record<string, any> | undefined;
}

export const BasicInformationReadSection = ({
  material,
  fields,
}: BasicInformationReadSectionProps) => {
  if (!material) return null;

  return (
    <DataGrid
      data={material}
      title="Basic Information"
      fields={fields as Record<string, SchemaField> | undefined}
      primaryKeys={['name', 'slug', 'brand', 'brand_specific_id']}
      excludeKeys={[
        'uuid',
        'primary_color',
        'secondary_colors',
        'transmission_distance',
        'refractive_index',
        'tags',
        'certifications',
        'photos',
        'properties',
        'print_sheet_compatibility',
      ]}
      entity="material"
    />
  );
};
