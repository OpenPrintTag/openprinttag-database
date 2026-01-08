import { FieldEditor, type SchemaField } from '~/components/SchemaFields';

import type { Material } from '../types';

interface AdditionalInformationEditSectionProps {
  fields: Record<string, unknown> | undefined;
  form: Material;
  onFieldChange: (key: string, value: unknown) => void;
}

const EXCLUDED_FIELDS = [
  'uuid',
  'name',
  'slug',
  'brand',
  'brand_specific_id',
  'class',
  'type',
  'abbreviation',
  'url',
  'primary_color',
  'secondary_colors',
  'transmission_distance',
  'refractive_index',
  'tags',
  'certifications',
  'photos',
  'properties',
  'print_sheet_compatibility',
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
