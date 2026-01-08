import React from 'react';

import { FieldEditor, type SchemaField } from '~/components/SchemaFields';

import type { Package } from './types';

interface PackageSheetEditViewProps {
  fields: Record<string, SchemaField> | null;
  form: Package;
  onFieldChange: (key: string, value: unknown) => void;
  schema: any;
}

export const PackageSheetEditView = ({
  fields,
  form,
  onFieldChange,
}: PackageSheetEditViewProps) => {
  if (!fields) {
    return (
      <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        Schema for packages not loaded. Cannot edit package.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Package Information
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Object.entries(fields).map(([key, field]) => {
            // Skip UUID fields (both uuid and deprecated directus_uuid)
            if (key === 'uuid' || key === 'directus_uuid') return null;

            const value = form?.[key];
            const rawValue =
              typeof value === 'object' && value !== null && 'slug' in value
                ? (value as any).slug
                : value;

            return (
              <FieldEditor
                key={key}
                label={key}
                field={field as SchemaField}
                value={rawValue}
                onChange={(val) => onFieldChange(key, val)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
