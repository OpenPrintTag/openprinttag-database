import type { EntityFields } from '~/components/fieldTypes';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';

import type { Brand } from '../types';

interface BasicInformationEditSectionProps {
  fields?: EntityFields;
  form: Partial<Brand>;
  onFieldChange: (key: string, value: unknown) => void;
}

export const BasicInformationEditSection = ({
  fields,
  form,
  onFieldChange,
}: BasicInformationEditSectionProps) => {
  if (!fields) return null;

  return (
    <div className="card">
      <div className="card-header">Basic Information</div>
      <div className="card-body">
        <div className="grid gap-4 sm:grid-cols-2">
          {['name', 'slug', 'uuid', 'countries_of_origin'].map((key) => {
            if (!fields[key]) return null;
            return (
              <FieldEditor
                key={key}
                label={key}
                field={fields[key] as SchemaField}
                value={form?.[key]}
                disabled={key !== 'countries_of_origin'}
                onChange={(val) => onFieldChange(key, val)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
