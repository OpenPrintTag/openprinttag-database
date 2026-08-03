import { EntityFields } from '~/components/fieldTypes';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';
import { useClassFields } from '~/hooks/useClassFields';

import type { Material } from '../types';

interface VisualPropertiesEditSectionProps {
  fields?: EntityFields;
  form: Material;
  onFieldChange: (key: string, value: unknown) => void;
  brandId?: string;
}

export const VisualPropertiesEditSection = ({
  fields,
  form,
  onFieldChange,
  brandId,
}: VisualPropertiesEditSectionProps) => {
  const filteredFields = useClassFields(fields, form?.class);

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
            if (!filteredFields?.[key]) return null;
            return (
              <FieldEditor
                key={key}
                label={key}
                field={filteredFields[key] as SchemaField}
                value={form?.[key]}
                onChange={(val) => onFieldChange(key, val)}
                brandId={brandId}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
