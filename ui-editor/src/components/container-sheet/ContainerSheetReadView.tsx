import { DataGrid } from '~/components/DataGrid';
import type { SchemaField } from '~/components/SchemaFields';

import type { Container } from './types';

interface ContainerSheetReadViewProps {
  container?: Container;
  fields: Record<string, SchemaField> | undefined;
}

export const ContainerSheetReadView = ({
  container,
  fields,
}: ContainerSheetReadViewProps) => {
  if (!container) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        No container data available
      </div>
    );
  }

  return (
    <div className="my-6 space-y-6">
      {!fields && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Schema for containers not loaded. Showing raw container data.
        </div>
      )}
      <DataGrid
        title="Container details"
        data={container}
        fields={fields}
        primaryKeys={['uuid', 'slug', 'name', 'class']}
        entity="container"
      />
    </div>
  );
};
