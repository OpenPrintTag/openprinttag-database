import type { Package } from '../types';

interface SystemInformationReadSectionProps {
  package?: Package;
}

export const SystemInformationReadSection = ({
  package: pkg,
}: SystemInformationReadSectionProps) => {
  if (!pkg?.directus_uuid) {
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
            {String(pkg.directus_uuid)}
          </dd>
        </div>
      </div>
    </div>
  );
};
