import { DataGrid } from '~/components/DataGrid';
import type { SchemaField } from '~/components/SchemaFields';

import type { Brand } from '../types';

interface BrandReadViewProps {
  brand?: Brand;
  fields: Record<string, SchemaField> | undefined;
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
