import { MultiSelect } from '~/components/MultiSelect';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';

import type { Brand, SelectOption } from '../types';

interface MetadataEditSectionProps {
  fields: Record<string, unknown> | undefined;
  form: Partial<Brand>;
  onFieldChange: (key: string, value: unknown) => void;
  countriesOptions: SelectOption[];
}

export const MetadataEditSection = ({
  fields,
  form,
  onFieldChange,
  countriesOptions,
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
          {Boolean(fields.countries) && (
            <div>
              <label
                htmlFor="countries-select"
                className="mb-2 block text-xs font-medium tracking-wide text-gray-500 uppercase"
              >
                Countries
              </label>
              <MultiSelect
                id="countries-select"
                options={countriesOptions}
                value={form?.countries || []}
                onChange={(countries) => onFieldChange('countries', countries)}
                placeholder="Select countries..."
                searchPlaceholder="Search countries..."
              />
            </div>
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
