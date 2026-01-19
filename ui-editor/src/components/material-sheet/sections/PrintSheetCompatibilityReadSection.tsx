import { DataGrid } from '~/components/DataGrid';
import type { EntityFields } from '~/components/fieldTypes';

import type { Material } from '../types';

interface PrintSheetCompatibilityReadSectionProps {
  material?: Material;
  fields?: EntityFields;
}

export const PrintSheetCompatibilityReadSection = ({
  material,
  fields,
}: PrintSheetCompatibilityReadSectionProps) => {
  if (!fields || !material?.print_sheet_compatibility) {
    return null;
  }

  return (
    <DataGrid
      data={material}
      title="Print Sheet Compatibility"
      fields={fields}
      primaryKeys={['print_sheet_compatibility']}
      excludeKeys={Object.keys(fields).filter(
        (k) => k !== 'print_sheet_compatibility',
      )}
      entity="material"
    />
  );
};
