import { EntityFields } from '~/components/fieldTypes';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';

import type { Material } from '../types';

interface PropertiesEditSectionProps {
  fields?: EntityFields;
  form: Material;
  onFieldChange: (key: string, value: unknown) => void;
  brandId?: string;
}

export const PropertiesEditSection = ({
  fields,
  form,
  onFieldChange,
  brandId,
}: PropertiesEditSectionProps) => {
  if (!fields || !fields.properties) return null;

  return (
    <div className="card">
      <div className="card-header">Material Properties</div>
      <div className="card-body">
        <FieldEditor
          label="properties"
          field={fields.properties as SchemaField}
          value={form?.properties}
          onChange={(val) => onFieldChange('properties', val)}
          brandId={brandId}
        />
      </div>
    </div>
  );
};
