import { DataGrid } from '~/components/DataGrid';
import { EntityFields } from '~/components/field-types';

import type { Material } from '../types';

interface PhotosReadSectionProps {
  material?: Material;
  fields?: EntityFields;
}

export const PhotosReadSection = ({
  material,
  fields,
}: PhotosReadSectionProps) => {
  if (!fields || !material?.photos || material.photos.length === 0) {
    return null;
  }

  return (
    <DataGrid
      data={material}
      fields={fields}
      title="Photos"
      primaryKeys={['photos']}
      excludeKeys={Object.keys(fields).filter((k) => k !== 'photos')}
      entity="material"
    />
  );
};
