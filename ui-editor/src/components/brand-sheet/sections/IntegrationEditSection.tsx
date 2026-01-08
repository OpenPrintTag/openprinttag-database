import type { EntityFields } from '~/components/field-types';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';

import type { Brand } from '../types';

interface IntegrationEditSectionProps {
  fields?: EntityFields;
  form: Partial<Brand>;
  onFieldChange: (key: string, value: unknown) => void;
}

export const IntegrationEditSection = ({
  fields,
  form,
  onFieldChange,
}: IntegrationEditSectionProps) => {
  if (!fields) return null;

  const hasIntegrationFields =
    fields.uuid ||
    fields.material_url_template ||
    fields.material_package_url_template ||
    fields.material_package_instance_url_template;

  if (!hasIntegrationFields) return null;

  return (
    <div className="card">
      <div className="card-header">Integration & URLs</div>
      <div className="card-body">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            'uuid',
            'material_url_template',
            'material_package_url_template',
            'material_package_instance_url_template',
          ].map((key) => {
            if (!fields[key]) return null;
            return (
              <div
                key={key}
                className={key.includes('template') ? 'sm:col-span-2' : ''}
              >
                <FieldEditor
                  label={key}
                  field={fields[key] as SchemaField}
                  value={form?.[key]}
                  onChange={(val) => onFieldChange(key, val)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
