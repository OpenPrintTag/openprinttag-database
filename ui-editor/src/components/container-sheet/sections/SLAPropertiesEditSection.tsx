import type { Container } from '../types';

interface SLAPropertiesEditSectionProps {
  form: Container;
}

export const SLAPropertiesEditSection = ({
  form,
}: SLAPropertiesEditSectionProps) => {
  // Only show for SLA containers
  if (form.class !== 'SLA') return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        SLA Properties
      </h3>
      <div className="text-sm text-gray-500 italic">
        No specific SLA properties required for now.
      </div>
    </div>
  );
};
