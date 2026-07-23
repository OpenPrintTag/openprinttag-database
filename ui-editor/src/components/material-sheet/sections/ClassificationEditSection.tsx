import type { EntityFields } from '~/components/fieldTypes';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';
import { useClassFields } from '~/hooks/useClassFields';

import type { Material } from '../types';

interface ClassificationEditSectionProps {
  fields?: EntityFields;
  form: Material;
  onFieldChange: (key: string, value: unknown) => void;
  brandId?: string;
}

export const ClassificationEditSection = ({
  fields,
  form,
  onFieldChange,
  brandId,
}: ClassificationEditSectionProps) => {
  const filteredFields = useClassFields(fields, form?.class);

  if (!fields) return null;

  return (
    <div className="card">
      <div className="card-header">Classification</div>
      <div className="card-body">
        <div className="grid gap-4 sm:grid-cols-2">
          {['class', 'type', 'abbreviation', 'url'].map((key) => {
            if (!filteredFields?.[key]) return null;

            return (
              <div key={key} className={key === 'url' ? 'sm:col-span-2' : ''}>
                <FieldEditor
                  label={key}
                  field={filteredFields[key] as SchemaField}
                  value={form?.[key]}
                  onChange={(val) => onFieldChange(key, val)}
                  brandId={brandId}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
