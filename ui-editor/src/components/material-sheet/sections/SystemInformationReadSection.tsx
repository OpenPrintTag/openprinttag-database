import type { Material } from '../types';

interface SystemInformationReadSectionProps {
  material?: Material;
}

export const SystemInformationReadSection = ({
  material,
}: SystemInformationReadSectionProps) => {
  if (!material?.directus_uuid) {
    return null;
  }

  return (
    <div className="card">
      <div className="card-header">System Information</div>
      <div className="card-body">
        <div>
          <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            Directus UUID
          </dt>
          <dd className="mt-1 font-mono text-xs text-gray-600">
            {String(material.directus_uuid)}
          </dd>
        </div>
      </div>
    </div>
  );
};
