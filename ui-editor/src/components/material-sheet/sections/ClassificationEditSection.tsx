import { FieldEditor, type SchemaField } from '~/components/SchemaFields';

import { classOptions } from '../hooks';
import type { Material, SelectOption } from '../types';

interface ClassificationEditSectionProps {
  fields: Record<string, unknown> | null;
  form: Material;
  onFieldChange: (key: string, value: unknown) => void;
  materialTypesOptions: SelectOption[];
}

export const ClassificationEditSection = ({
  fields,
  form,
  onFieldChange,
  materialTypesOptions,
}: ClassificationEditSectionProps) => {
  if (!fields) return null;

  return (
    <div className="card">
      <div className="card-header">Classification</div>
      <div className="card-body">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="class-select"
              className="mb-2 block text-xs font-medium tracking-wide text-gray-500 uppercase"
            >
              Class <span className="text-red-500">*</span>
            </label>
            <select
              id="class-select"
              className="select"
              value={form?.class || ''}
              onChange={(e) => onFieldChange('class', e.target.value)}
              required
            >
              <option value="">Select class...</option>
              {classOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="type-id-select"
              className="mb-2 block text-xs font-medium tracking-wide text-gray-500 uppercase"
            >
              Type
            </label>
            <select
              id="type-id-select"
              className="select"
              value={form?.type_id || ''}
              onChange={(e) =>
                onFieldChange(
                  'type_id',
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            >
              <option value="">Select type...</option>
              {materialTypesOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {fields.abbreviation ? (
            <FieldEditor
              label="abbreviation"
              field={fields.abbreviation as SchemaField}
              value={form?.abbreviation}
              onChange={(val) => onFieldChange('abbreviation', val)}
            />
          ) : null}

          {fields.url ? (
            <div className="sm:col-span-2">
              <FieldEditor
                label="url"
                field={fields.url as SchemaField}
                value={form?.url}
                onChange={(val) => onFieldChange('url', val)}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
