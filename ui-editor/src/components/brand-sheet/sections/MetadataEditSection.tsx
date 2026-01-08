import type { EntityFields } from '~/components/field-types';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';

import type { Brand } from '../types';

interface MetadataEditSectionProps {
  fields?: EntityFields;
  form: Partial<Brand>;
  onFieldChange: (key: string, value: unknown) => void;
}

export const MetadataEditSection = ({
  fields,
  form,
  onFieldChange,
}: MetadataEditSectionProps) => {
  if (!fields) return null;

  const hasMetadataFields =
    fields.keywords || fields.link_patterns || fields.countries_of_origin;

  if (!hasMetadataFields) return null;

  return (
    <div className="card">
      <div className="card-header">Metadata</div>
      <div className="card-body">
        <div className="space-y-4">
          {Boolean(fields.countries_of_origin) && (
            <FieldEditor
              label="countries_of_origin"
              field={fields.countries_of_origin as SchemaField}
              value={form?.countries_of_origin}
              onChange={(val) => onFieldChange('countries_of_origin', val)}
            />
          )}
          {['keywords', 'link_patterns'].map((key) => {
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
