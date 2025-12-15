import React from 'react';

import { DataGrid } from '~/components/DataGrid';
import type { SchemaField } from '~/components/SchemaFields';

import { SystemInformationReadSection } from './sections/SystemInformationReadSection';
import type { Package } from './types';

interface PackageSheetReadViewProps {
  package?: Package;
  fields: Record<string, SchemaField> | null;
}

export const PackageSheetReadView = ({
  package: pkg,
  fields,
}: PackageSheetReadViewProps) => {
  if (!pkg) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        No package data available
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <DataGrid
        title="Package Information"
        fields={fields ? (fields as Record<string, SchemaField>) : undefined}
        data={pkg}
        primaryKeys={['uuid', 'slug', 'name']}
        excludeKeys={['directus_uuid']}
      />
      <SystemInformationReadSection package={pkg} />
    </div>
  );
};
