import type { Container } from '../types';

interface PhysicalPropertiesReadSectionProps {
  container?: Container;
}

export const PhysicalPropertiesReadSection = ({
  container,
}: PhysicalPropertiesReadSectionProps) => {
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    return String(value);
  };

  const hasAnyValue =
    container?.volumetric_capacity !== undefined ||
    container?.empty_weight !== undefined;

  if (!hasAnyValue) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Physical Properties
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {container?.volumetric_capacity !== undefined && (
          <div>
            <div className="text-sm font-medium text-gray-700">
              Volumetric Capacity
            </div>
            <div className="mt-1 text-sm text-gray-900">
              {formatValue(container.volumetric_capacity)}
            </div>
          </div>
        )}
        {container?.empty_weight !== undefined && (
          <div>
            <div className="text-sm font-medium text-gray-700">
              Empty Weight
            </div>
            <div className="mt-1 text-sm text-gray-900">
              {formatValue(container.empty_weight)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
