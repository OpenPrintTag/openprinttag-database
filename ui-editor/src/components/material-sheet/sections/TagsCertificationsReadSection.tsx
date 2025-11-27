import { DataGrid } from '~/components/DataGrid';
import { EntityFields } from '~/components/fieldTypes';

import type { Material } from '../types';

interface TagsCertificationsReadSectionProps {
  material?: Material;
  fields?: EntityFields;
}

export const TagsCertificationsReadSection = ({
  material,
  fields,
}: TagsCertificationsReadSectionProps) => {
  if (
    !fields ||
    (!material?.tags?.length && !material?.certifications?.length)
  ) {
    return null;
  }

  return (
    <DataGrid
      data={material}
      title="Classification & Certifications"
      fields={fields}
      primaryKeys={['tags', 'certifications']}
      excludeKeys={Object.keys(fields).filter(
        (k) => k !== 'tags' && k !== 'certifications',
      )}
      entity="material"
    />
  );
};
