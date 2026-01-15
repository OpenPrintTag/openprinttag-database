import { DataGrid } from '~/components/DataGrid';
import { EntityFields } from '~/components/field-types';

import { SystemInformationReadSection } from './sections/SystemInformationReadSection';
import type { Package } from './types';

interface PackageSheetReadViewProps {
  package?: Package;
  fields: EntityFields;
  brandId: string;
}

export const PackageSheetReadView = ({
  package: pkg,
  fields,
  brandId,
}: PackageSheetReadViewProps) => {
  if (!pkg) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        No package data available
      </div>
    );
  }

  return (
    <div className="my-6 space-y-6">
      <DataGrid
        title="Package Information"
        fields={fields}
        data={pkg}
        brandId={brandId}
        entity="package"
        primaryKeys={['uuid', 'slug', 'name']}
        excludeKeys={['directus_uuid']}
      />
      <SystemInformationReadSection package={pkg} />
    </div>
  );
};
