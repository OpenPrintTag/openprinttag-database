import { DataGrid } from '~/components/DataGrid';
import { EntityFields } from '~/components/field-types';

import type { Material } from '../types';

interface SystemInformationReadSectionProps {
  material?: Material;
  fields?: EntityFields;
}

export const SystemInformationReadSection = ({
  material,
  fields,
}: SystemInformationReadSectionProps) => {
  if (!fields || !material?.uuid) {
    return null;
  }

  return (
    <DataGrid
      data={material}
      title="System Information"
      primaryKeys={['uuid']}
      excludeKeys={Object.keys(fields).filter((k) => k !== 'uuid')}
      entity="material"
    />
  );
};
