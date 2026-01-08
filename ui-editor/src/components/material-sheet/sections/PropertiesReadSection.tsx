import { DataGrid } from '~/components/DataGrid';
import { EntityFields } from '~/components/field-types';

import type { Material } from '../types';

interface PropertiesReadSectionProps {
  material?: Material;
  fields?: EntityFields;
}

export const PropertiesReadSection = ({
  material,
  fields,
}: PropertiesReadSectionProps) => {
  if (!material?.properties || Object.keys(material.properties).length === 0) {
    return null;
  }

  return (
    <DataGrid
      data={material}
      title="Material Properties"
      primaryKeys={['properties']}
      excludeKeys={Object.keys(fields).filter((k) => k !== 'properties')}
      entity="material"
    />
  );
};
