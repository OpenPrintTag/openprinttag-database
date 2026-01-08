import { FieldEditor, type SchemaField } from '~/components/SchemaFields';

import type { Container } from './types';

interface ContainerSheetEditViewProps {
  form: Container;
  onFieldChange: (key: string, value: unknown) => void;
  fields: Record<string, SchemaField> | undefined;
}

export const ContainerSheetEditView = ({
  form,
  onFieldChange,
  fields,
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
              if (key === 'directus_uuid') return null;

              const value = form?.[key];
              const rawValue =
                typeof value === 'object' && value !== null && 'slug' in value
                  ? (value as any).slug
                  : value;

              const isReadonlySlug = key === 'slug' && field.type === 'slug';
              const isUuid = field.type === 'uuid' || key === 'uuid';

              return (
                <FieldEditor
                  key={key}
                  label={field.label ?? key}
                  field={field}
                  value={rawValue}
                  onChange={(val) => onFieldChange(key, val)}
                  disabled={isReadonlySlug || isUuid}
                  entity="material_container"
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
