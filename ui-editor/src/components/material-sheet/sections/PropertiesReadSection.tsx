import type { Material } from '../types';

interface PropertiesReadSectionProps {
  material?: Material;
}

export const PropertiesReadSection = ({
  material,
}: PropertiesReadSectionProps) => {
  if (!material?.properties || Object.keys(material.properties).length === 0) {
    return null;
  }

  return (
    <div className="card">
      <div className="card-header">Material Properties</div>
      <div className="card-body">
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(material.properties).map(([key, value]) => (
            <div key={key}>
              <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                {key.replace(/_/g, ' ')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {String(value || '—')}
              </dd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
