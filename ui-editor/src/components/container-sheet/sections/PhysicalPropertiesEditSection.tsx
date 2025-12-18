import type { Container } from '../types';

interface PhysicalPropertiesEditSectionProps {
  form: Container;
  onFieldChange: (key: string, value: unknown) => void;
}

export const PhysicalPropertiesEditSection = ({
  form,
  onFieldChange,
}: PhysicalPropertiesEditSectionProps) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Physical Properties
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Volumetric Capacity
          </label>
          <input
            type="number"
            value={form.volumetric_capacity ?? ''}
            onChange={(e) =>
              onFieldChange(
                'volumetric_capacity',
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
            placeholder="Enter volumetric capacity"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Empty Weight
          </label>
          <input
            type="number"
            value={form.empty_weight ?? ''}
            onChange={(e) =>
              onFieldChange(
                'empty_weight',
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
            placeholder="Enter empty weight"
          />
        </div>
      </div>
    </div>
  );
};
