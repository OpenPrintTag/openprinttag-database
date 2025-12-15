import { FieldEditor, type SchemaField } from '~/components/SchemaFields';

import type { Brand } from '../types';

interface MetadataEditSectionProps {
  fields: Record<string, unknown> | undefined;
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
    fields.keywords || fields.link_patterns || fields.countries;

  if (!hasMetadataFields) return null;

  return (
    <div className="card">
      <div className="card-header">Metadata</div>
      <div className="card-body">
        <div className="space-y-4">
          {['keywords', 'link_patterns', 'countries'].map((key) => {
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
