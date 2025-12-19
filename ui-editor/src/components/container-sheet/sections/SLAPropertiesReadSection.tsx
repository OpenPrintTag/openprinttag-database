import type { Container } from '../types';

interface SLAPropertiesReadSectionProps {
  container?: Container;
}

export const SLAPropertiesReadSection = ({
  container,
}: SLAPropertiesReadSectionProps) => {
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    return String(value);
  };

  if (!container?.connector_slug) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        SLA Properties
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="text-sm font-medium text-gray-700">
            Connector Slug
          </div>
          <div className="mt-1 text-sm text-gray-900">
            {formatValue(container.connector_slug)}
          </div>
        </div>
      </div>
    </div>
  );
};
