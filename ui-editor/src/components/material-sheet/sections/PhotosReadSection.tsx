import { DataGrid } from '~/components/DataGrid';

import type { Material } from '../types';

interface PhotosReadSectionProps {
  material?: Material;
}

export const PhotosReadSection = ({ material }: PhotosReadSectionProps) => {
  if (!material?.photos || material.photos.length === 0) {
    return null;
  }

  return (
    <DataGrid
      data={material}
      title="Photos"
      primaryKeys={['photos']}
      excludeKeys={Object.keys(material).filter((k) => k !== 'photos')}
      entity="material"
    />
  );
};
