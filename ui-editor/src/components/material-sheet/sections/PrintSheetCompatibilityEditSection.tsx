import { EntityFields } from '~/components/field-types';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';

import type { Material } from '../types';

interface PrintSheetCompatibilityEditSectionProps {
  fields?: EntityFields;
  form: Material;
  onFieldChange: (key: string, value: unknown) => void;
  brandId?: string;
}

export const PrintSheetCompatibilityEditSection = ({
  fields,
  form,
  onFieldChange,
  brandId,
}: PrintSheetCompatibilityEditSectionProps) => {
  if (!fields || !fields.print_sheet_compatibility) return null;

  return (
    <div className="card">
      <div className="card-header">Print Sheet Compatibility</div>
      <div className="card-body">
        <FieldEditor
          label="print_sheet_compatibility"
          field={fields.print_sheet_compatibility as SchemaField}
          value={form?.print_sheet_compatibility}
          onChange={(val) => onFieldChange('print_sheet_compatibility', val)}
          brandId={brandId}
        />
      </div>
    </div>
  );
};
