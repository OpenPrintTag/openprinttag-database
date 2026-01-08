import { EntityFields } from '~/components/field-types';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';

import type { Material } from '../types';

interface PropertiesEditSectionProps {
  fields?: EntityFields;
  form: Material;
  onFieldChange: (key: string, value: unknown) => void;
}

export const PropertiesEditSection = ({
  fields,
  form,
  onFieldChange,
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
        />
      </div>
    </div>
  );
};
