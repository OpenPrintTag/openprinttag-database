import { memo, useCallback, useMemo } from 'react';

import { FieldEditor, type SchemaField } from '~/components/SchemaFields';
import { extractFieldValue } from '~/utils/field';

import type { Package } from './types';

interface PackageSheetEditViewProps {
  fields: Record<string, SchemaField> | null;
  form: Package;
  onFieldChange: (key: string, value: unknown) => void;
}

interface FieldItemProps {
  fieldKey: string;
  field: SchemaField;
  value: unknown;
  onFieldChange: (key: string, value: unknown) => void;
  disabled: boolean;
}

const FieldItem = memo(
  ({ fieldKey, field, value, onFieldChange, disabled }: FieldItemProps) => {
    const rawValue = extractFieldValue(fieldKey, value);

    const handleChange = useCallback(
      (val: unknown) => onFieldChange(fieldKey, val),
      [fieldKey, onFieldChange],
    );

    return (
      <FieldEditor
        label={field.title ?? fieldKey}
        field={field}
        value={rawValue}
        onChange={handleChange}
        disabled={disabled}
        entity="material_package"
      />
    );
  },
);

FieldItem.displayName = 'FieldItem';

export const PackageSheetEditView = ({
  fields,
  form,
  onFieldChange,
}: PackageSheetEditViewProps) => {
  const fieldEntries = useMemo(
    () => (fields ? Object.entries(fields) : []),
    [fields],
  );

  if (!fields) {
    return (
      <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        Schema for packages not loaded. Cannot edit package.
      </div>
    );
  }

  return (
    <div className="my-6 space-y-6">
      <div className="card">
        <div className="card-header">Package Information</div>
        <div className="card-body">
          <div className="grid gap-4 sm:grid-cols-2">
            {fieldEntries.map(([key, field]) => {
              const isReadonlySlug = key === 'slug' && field.type === 'slug';
              const isUuid = field.type === 'uuid';

              return (
                <FieldItem
                  key={key}
                  fieldKey={key}
                  field={field as SchemaField}
                  value={form?.[key]}
                  onFieldChange={onFieldChange}
                  disabled={isReadonlySlug || isUuid}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
