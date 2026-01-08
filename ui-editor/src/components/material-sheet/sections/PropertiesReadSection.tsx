import { DataGrid } from '~/components/DataGrid';

import type { Material } from '../types';

interface PropertiesReadSectionProps {
  material?: Material;
}

export const PropertiesReadSection = ({
  material,
}: PropertiesReadSectionProps) => {
  if (!material?.properties || Object.keys(material.properties).length === 0) {
    return null;
  }

  return (
    <DataGrid
      data={material}
      title="Material Properties"
      primaryKeys={['properties']}
      excludeKeys={Object.keys(material).filter((k) => k !== 'properties')}
      entity="material"
    />
  );
};
