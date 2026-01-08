import { FieldEditor, type SchemaField } from '~/components/SchemaFields';

import type { Brand } from '../types';

interface AdditionalInformationEditSectionProps {
  fields: Record<string, unknown> | undefined;
  form: Partial<Brand>;
  onFieldChange: (key: string, value: unknown) => void;
}

const EXCLUDED_FIELDS = [
  'uuid',
  'name',
  'slug',
  'material_url_template',
  'material_package_url_template',
  'material_package_instance_url_template',
  'keywords',
  'link_patterns',
  'countries_of_origin',
];

export const AdditionalInformationEditSection = ({
  fields,
  form,
  onFieldChange,
}: AdditionalInformationEditSectionProps) => {
  if (!fields) return null;

  const hasAdditionalFields = Object.entries(fields).some(
    ([key]) => !EXCLUDED_FIELDS.includes(key),
  );

  if (!hasAdditionalFields) return null;

  return (
    <div className="card">
      <div className="card-header">Additional Information</div>
      <div className="card-body">
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(fields).map(([key, field]) => {
            if (EXCLUDED_FIELDS.includes(key)) return null;

            return (
              <FieldEditor
                key={key}
                label={key}
                field={field as SchemaField}
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
