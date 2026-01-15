import { FieldEditor, type SchemaField } from '~/components/SchemaFields';
import { extractFieldValue } from '~/utils/field';

import type { Container } from './types';

interface ContainerSheetEditViewProps {
  form: Container;
  onFieldChange: (key: string, value: unknown) => void;
  fields: Record<string, SchemaField> | undefined;
  brandId?: string;
}

export const ContainerSheetEditView = ({
  form,
  onFieldChange,
  fields,
  brandId,
}: ContainerSheetEditViewProps) => {
  if (!fields) {
    return (
      <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        Schema for containers not loaded. Cannot edit container.
      </div>
    );
  }

  return (
    <div className="my-6 space-y-6">
      <div className="card">
        <div className="card-header">Container Information</div>
        <div className="card-body">
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(fields).map(([key, field]) => {
              if (!fields[key]) return null;

              // slug and brand should be disabled
              const isDisabled =
                key === 'slug' || (key === 'brand' && !!brandId);
              const rawValue = extractFieldValue(key, form?.[key]);

              return (
                <FieldEditor
                  key={key}
                  label={key}
                  field={field}
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
    </div>
  );
};
