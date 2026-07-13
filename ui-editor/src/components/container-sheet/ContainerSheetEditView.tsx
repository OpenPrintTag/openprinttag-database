import { FieldEditor, type SchemaField } from '~/components/SchemaFields';
import { useClassFields } from '~/hooks/useClassFields';
import { extractFieldValue } from '~/utils/field';

import type { Container } from './types';

interface ContainerSheetEditViewProps {
  form: Container;
  onFieldChange: (key: string, value: unknown) => void;
  fields: Record<string, SchemaField> | undefined;
  brandId?: string;
}

const BASIC_FIELDS = [
  'uuid',
  'slug',
  'class',
  'brand',
  'brand_specific_id',
  'name',
];
const SHARED_SPEC_FIELDS = ['volumetric_capacity', 'empty_weight'];

export const ContainerSheetEditView = ({
  form,
  onFieldChange,
  fields,
  brandId,
}: ContainerSheetEditViewProps) => {
  const filteredFields = useClassFields(fields, form?.class);
  if (!fields) {
    return (
      <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        Schema for containers not loaded. Cannot edit container.
      </div>
    );
  }

  // Class-specific fields = everything not in BASIC or SHARED
  const classSpecificKeys = Object.keys(filteredFields || {}).filter(
    (key) => !BASIC_FIELDS.includes(key) && !SHARED_SPEC_FIELDS.includes(key),
  );

  let sectionTitle = 'Dimensions';
  if (form?.class === 'SLA') sectionTitle = 'SLA Dimensions';
  else if (form?.class === 'FFF') sectionTitle = 'FFF Dimensions';

  return (
    <div className="my-6 space-y-6">
      <div className="card">
        <div className="card-header">Container Information</div>
        <div className="card-body">
          <div className="grid gap-4 sm:grid-cols-2">
            {BASIC_FIELDS.map((key) => {
              if (!filteredFields?.[key]) return null;
              const isDisabled =
                key === 'slug' || (key === 'brand' && !!brandId);
              const rawValue = extractFieldValue(key, form?.[key]);
              return (
                <FieldEditor
                  key={key}
                  label={key}
                  field={filteredFields[key] as SchemaField}
                  value={rawValue}
                  onChange={(val) => onFieldChange(key, val)}
                  disabled={isDisabled}
                  brandId={brandId}
                />
              );
            })}
          </div>
        </div>
      </div>

      {classSpecificKeys.length > 0 && (
        <div className="card">
          <div className="card-header">{sectionTitle}</div>
          <div className="card-body">
            <div className="grid gap-4 sm:grid-cols-2">
              {classSpecificKeys.map((key) => {
                const rawValue = extractFieldValue(key, form?.[key]);
                return (
                  <FieldEditor
                    key={key}
                    label={key}
                    field={filteredFields![key] as SchemaField}
                    value={rawValue}
                    onChange={(val) => onFieldChange(key, val)}
                    brandId={brandId}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">Specifications</div>
        <div className="card-body">
          <div className="grid gap-4 sm:grid-cols-2">
            {SHARED_SPEC_FIELDS.map((key) => {
              if (!filteredFields?.[key]) return null;
              const rawValue = extractFieldValue(key, form?.[key]);
              return (
                <FieldEditor
                  key={key}
                  label={key}
                  field={filteredFields[key] as SchemaField}
                  value={rawValue}
                  onChange={(val) => onFieldChange(key, val)}
                  brandId={brandId}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
