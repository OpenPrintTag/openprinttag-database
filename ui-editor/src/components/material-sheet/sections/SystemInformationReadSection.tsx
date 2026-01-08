import { DataGrid } from '~/components/DataGrid';

import type { Material } from '../types';

interface SystemInformationReadSectionProps {
  material?: Material;
}

export const SystemInformationReadSection = ({
  material,
}: SystemInformationReadSectionProps) => {
  if (!material?.uuid) {
    return null;
  }

  return (
    <DataGrid
      data={material}
      title="System Information"
      primaryKeys={['uuid']}
      excludeKeys={Object.keys(material).filter((k) => k !== 'uuid')}
      entity="material"
    />
  );
};
