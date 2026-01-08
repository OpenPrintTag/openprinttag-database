import { DataGrid } from '~/components/DataGrid';
import type { SchemaField } from '~/components/field-types';

import type { Material } from '../types';

interface PrintSheetCompatibilityReadSectionProps {
  material?: Material;
  fields: Record<string, unknown> | undefined;
}

export const PrintSheetCompatibilityReadSection = ({
  material,
  fields,
}: PrintSheetCompatibilityReadSectionProps) => {
  if (!material?.print_sheet_compatibility) {
    return null;
  }

  return (
    <DataGrid
      data={material}
      title="Print Sheet Compatibility"
      fields={fields as Record<string, SchemaField> | undefined}
      primaryKeys={['print_sheet_compatibility']}
      excludeKeys={Object.keys(material).filter(
        (k) => k !== 'print_sheet_compatibility',
      )}
      entity="material"
    />
  );
};
