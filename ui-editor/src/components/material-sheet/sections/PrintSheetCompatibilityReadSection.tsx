import type { SchemaField } from '~/components/SchemaFields';
import { ValueDisplay } from '~/components/ValueDisplay';

import type { Material } from '../types';

interface PrintSheetCompatibilityReadSectionProps {
  material?: Material;
  fields: Record<string, unknown> | null;
}

export const PrintSheetCompatibilityReadSection = ({
  material,
  fields,
}: PrintSheetCompatibilityReadSectionProps) => {
  if (!material?.print_sheet_compatibility) {
    return null;
  }

  return (
    <div className="card">
      <div className="card-header">Print Sheet Compatibility</div>
      <div className="card-body">
        <ValueDisplay
          value={material.print_sheet_compatibility}
          field={fields?.print_sheet_compatibility as SchemaField | undefined}
        />
      </div>
    </div>
  );
};
