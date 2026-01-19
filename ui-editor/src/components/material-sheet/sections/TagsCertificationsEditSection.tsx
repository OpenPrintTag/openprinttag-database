import { EntityFields } from '~/components/fieldTypes';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';

import type { Material } from '../types';

interface TagsCertificationsEditSectionProps {
  fields?: EntityFields;
  form: Material;
  onFieldChange: (key: string, value: unknown) => void;
  brandId?: string;
}

export const TagsCertificationsEditSection = ({
  fields,
  form,
  onFieldChange,
  brandId,
}: TagsCertificationsEditSectionProps) => {
  if (!fields) return null;

  return (
    <div className="card">
      <div className="card-header">Tags & Certifications</div>
      <div className="card-body">
        <div className="space-y-4">
          {['tags', 'certifications'].map((key) => {
            if (!fields[key]) return null;

            return (
              <FieldEditor
                key={key}
                label={key}
                field={fields[key] as SchemaField}
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
