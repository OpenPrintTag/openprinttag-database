import { DataGrid } from '~/components/DataGrid';
import { EntityFields } from '~/components/field-types';

import type { Brand } from '../types';

interface BrandReadViewProps {
  brand?: Brand;
  fields: EntityFields;
}

export const BrandReadView = ({ brand, fields }: BrandReadViewProps) => {
  if (!brand) {
    return (
      <div className="my-6 text-sm text-gray-500">No brand data available</div>
    );
  }

  return (
    <div className="my-6">
      <DataGrid
        data={brand}
        title="Brand details"
        fields={fields}
        primaryKeys={['uuid', 'slug', 'name']}
      />
    </div>
  );
};
