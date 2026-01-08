import { DataGrid } from '~/components/DataGrid';
import type { SchemaField } from '~/components/field-types';

import type { Material } from '../types';

interface TagsCertificationsReadSectionProps {
  material?: Material;
  fields: Record<string, unknown> | undefined;
}

export const TagsCertificationsReadSection = ({
  material,
  fields,
}: TagsCertificationsReadSectionProps) => {
  if (!material?.tags?.length && !material?.certifications?.length) {
    return null;
  }

  return (
    <DataGrid
      data={material}
      title="Classification & Certifications"
      fields={fields as Record<string, SchemaField> | undefined}
      primaryKeys={['tags', 'certifications']}
      excludeKeys={Object.keys(material).filter(
        (k) => k !== 'tags' && k !== 'certifications',
      )}
      entity="material"
    />
  );
};
