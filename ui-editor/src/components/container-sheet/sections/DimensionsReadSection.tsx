import type { Container } from '../types';

interface DimensionsReadSectionProps {
  container?: Container;
}

export const DimensionsReadSection = ({
  container,
}: DimensionsReadSectionProps) => {
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    return String(value);
  };

  const hasAnyValue =
    container?.hole_diameter !== undefined ||
    container?.inner_diameter !== undefined ||
    container?.outer_diameter !== undefined ||
    container?.width !== undefined ||
    container?.length !== undefined ||
    container?.height !== undefined;

  if (!hasAnyValue) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Dimensions</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {container?.hole_diameter !== undefined && (
          <div>
            <div className="text-sm font-medium text-gray-700">
              Hole Diameter
            </div>
            <div className="mt-1 text-sm text-gray-900">
              {formatValue(container.hole_diameter)}
            </div>
          </div>
        )}
        {container?.inner_diameter !== undefined && (
          <div>
            <div className="text-sm font-medium text-gray-700">
              Inner Diameter
            </div>
            <div className="mt-1 text-sm text-gray-900">
              {formatValue(container.inner_diameter)}
            </div>
          </div>
        )}
        {container?.outer_diameter !== undefined && (
          <div>
            <div className="text-sm font-medium text-gray-700">
              Outer Diameter
            </div>
            <div className="mt-1 text-sm text-gray-900">
              {formatValue(container.outer_diameter)}
            </div>
          </div>
        )}
        {container?.width !== undefined && (
          <div>
            <div className="text-sm font-medium text-gray-700">Width</div>
            <div className="mt-1 text-sm text-gray-900">
              {formatValue(container.width)}
            </div>
          </div>
        )}
        {container?.length !== undefined && (
          <div>
            <div className="text-sm font-medium text-gray-700">Length</div>
            <div className="mt-1 text-sm text-gray-900">
              {formatValue(container.length)}
            </div>
          </div>
        )}
        {container?.height !== undefined && (
          <div>
            <div className="text-sm font-medium text-gray-700">Height</div>
            <div className="mt-1 text-sm text-gray-900">
              {formatValue(container.height)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
