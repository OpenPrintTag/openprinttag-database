import { EntityFields } from '~/components/fieldTypes';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';
import { useClassFields } from '~/hooks/useClassFields';

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
  // Class filtering is schema-driven: the field carries x-class (e.g. FFF-only)
  // so the section hides itself for classes it doesn't apply to.
  const filteredFields = useClassFields(fields ?? undefined, form?.class);
  if (!filteredFields?.print_sheet_compatibility) return null;

  return (
    <div className="card">
      <div className="card-header">Print Sheet Compatibility</div>
      <div className="card-body">
        <FieldEditor
          label="print_sheet_compatibility"
          field={filteredFields.print_sheet_compatibility as SchemaField}
          value={form?.print_sheet_compatibility}
          onChange={(val) => onFieldChange('print_sheet_compatibility', val)}
          brandId={brandId}
        />
      </div>
    </div>
  );
};
