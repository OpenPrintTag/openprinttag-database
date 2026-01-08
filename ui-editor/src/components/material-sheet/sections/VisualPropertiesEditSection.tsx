import { EntityFields } from '~/components/field-types';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';

import type { Material } from '../types';

interface VisualPropertiesEditSectionProps {
  fields?: EntityFields;
  form: Material;
  onFieldChange: (key: string, value: unknown) => void;
}

export const VisualPropertiesEditSection = ({
  fields,
  form,
  onFieldChange,
}: VisualPropertiesEditSectionProps) => {
  if (!fields) return null;

  return (
    <div className="card">
      <div className="card-header">Visual Properties</div>
      <div className="card-body">
        <div className="space-y-4">
          {[
            'primary_color',
            'secondary_colors',
            'transmission_distance',
            'refractive_index',
          ].map((key) => {
            if (!fields[key]) return null;
            return (
              <FieldEditor
                key={key}
                label={key}
                field={fields[key] as SchemaField}
                value={form?.[key]}
                onChange={(val) => onFieldChange(key, val)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
