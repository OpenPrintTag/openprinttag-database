import { memo, useCallback } from 'react';

import { FieldEditor, type SchemaField } from '~/components/SchemaFields';
import { SchemaData } from '~/hooks/useSchema';
import { extractFieldValue } from '~/utils/field';

import type { Package } from './types';

interface PackageSheetEditViewProps {
  fields: Record<string, SchemaField> | null;
  form: Package;
  brandId: string;
  schema?: SchemaData;
  onFieldChange: (key: string, value: unknown) => void;
}

interface FieldItemProps {
  fieldKey: string;
  field: SchemaField;
  value: unknown;
  onFieldChange: (key: string, value: unknown) => void;
  disabled: boolean;
  brandId: string;
}

const FieldItem = memo(
  ({
    fieldKey,
    field,
    value,
    onFieldChange,
    disabled,
    brandId,
  }: FieldItemProps) => {
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
        brandId={brandId}
      />
    );
  },
);

FieldItem.displayName = 'FieldItem';

export const PackageSheetEditView = ({
  fields,
  form,
  schema,
  brandId,
  onFieldChange,
}: PackageSheetEditViewProps) => {
  return (
    <div className="my-6 space-y-6">
      {!schema && (
        <div className="text-sm text-amber-700">Loading schema...</div>
      )}
      {fields && (
        <div className="card">
          <div className="card-header">Package Information</div>
          <div className="card-body">
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(fields).map(([key, field]) => {
                const isReadonlySlug = key === 'slug' && field.type === 'slug';
                const isUuid = key === 'uuid';

                return (
                  <FieldItem
                    brandId={brandId}
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
      )}
    </div>
  );
};
