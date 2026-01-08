import type { EntityFields } from '~/components/field-types';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';

import type { Material } from '../types';

interface ClassificationEditSectionProps {
  fields?: EntityFields;
  form: Material;
  onFieldChange: (key: string, value: unknown) => void;
}

export const ClassificationEditSection = ({
  fields,
  form,
  onFieldChange,
}: ClassificationEditSectionProps) => {
  if (!fields) return null;

  return (
    <div className="card">
      <div className="card-header">Classification</div>
      <div className="card-body">
        <div className="grid gap-4 sm:grid-cols-2">
          {['class', 'type', 'abbreviation', 'url'].map((key) => {
            if (!fields[key]) return null;

            return (
              <div key={key} className={key === 'url' ? 'sm:col-span-2' : ''}>
                <FieldEditor
                  label={key}
                  field={fields[key] as SchemaField}
                  value={form?.[key]}
                  onChange={(val) => onFieldChange(key, val)}
                  entity="material"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
