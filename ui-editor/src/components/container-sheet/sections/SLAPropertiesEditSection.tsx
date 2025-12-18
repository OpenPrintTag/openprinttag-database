import type { Container } from '../types';

interface SLAPropertiesEditSectionProps {
  form: Container;
  onFieldChange: (key: string, value: unknown) => void;
  connectors: any[];
}

export const SLAPropertiesEditSection = ({
  form,
  onFieldChange,
  connectors,
}: SLAPropertiesEditSectionProps) => {
  // Only show for SLA containers
  if (form.class !== 'SLA') return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        SLA Properties
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Connector
          </label>
          <select
            value={String(form.connector_slug || '')}
            onChange={(e) =>
              onFieldChange('connector_slug', e.target.value || undefined)
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
          >
            <option value="">Select a connector...</option>
            {connectors.map((connector) => (
              <option key={connector.slug} value={connector.slug}>
                {connector.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
