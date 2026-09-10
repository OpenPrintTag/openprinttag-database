import { DataGrid } from '~/components/DataGrid';
import type { EntityFields } from '~/components/fieldTypes';
import { useClassFields } from '~/hooks/useClassFields';

import type { Material } from '../types';

interface PrintSheetCompatibilityReadSectionProps {
  material?: Material;
  fields?: EntityFields;
}

export const PrintSheetCompatibilityReadSection = ({
  material,
  fields,
}: PrintSheetCompatibilityReadSectionProps) => {
  // Class filtering is schema-driven: the field carries x-class (e.g. FFF-only)
  // so the section hides itself for classes it doesn't apply to.
  const filteredFields = useClassFields(fields ?? undefined, material?.class);
  if (!filteredFields?.print_sheet_compatibility) {
    return null;
  }
  if (!material?.print_sheet_compatibility) {
    return null;
  }

  return (
    <DataGrid
      data={material}
      title="Print Sheet Compatibility"
      fields={filteredFields}
      primaryKeys={['print_sheet_compatibility']}
      excludeKeys={Object.keys(filteredFields).filter(
        (k) => k !== 'print_sheet_compatibility',
      )}
    />
  );
};
