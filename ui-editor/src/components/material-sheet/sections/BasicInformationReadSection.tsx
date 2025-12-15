import type { Material, SelectOption } from '../types';

interface BasicInformationReadSectionProps {
  material?: Material;
  materialTypesOptions: SelectOption[];
}

export const BasicInformationReadSection = ({
  material,
  materialTypesOptions,
}: BasicInformationReadSectionProps) => {
  return (
    <div className="card">
      <div className="card-header">Basic Information</div>
      <div className="card-body">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              UUID
            </dt>
            <dd className="mt-1 font-mono text-sm text-gray-900">
              {material?.uuid || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Slug
            </dt>
            <dd className="mt-1 font-mono text-sm text-gray-900">
              {material?.slug || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Name
            </dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900">
              {material?.name || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Brand
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {(material?.brand_slug as string) ?? '—'}
            </dd>
          </div>
          {material?.brand_specific_id ? (
            <div>
              <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                Brand Specific ID
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {String(material.brand_specific_id)}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Class
            </dt>
            <dd className="mt-1">
              <span className="badge">{material?.class || '—'}</span>
            </dd>
          </div>
          {material?.type_id ? (
            <div>
              <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                Type
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {materialTypesOptions.find(
                  (opt) => opt.value === String(material.type_id),
                )?.label ?? material.type_id}
              </dd>
            </div>
          ) : null}
          {material?.abbreviation ? (
            <div>
              <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                Abbreviation
              </dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">
                {String(material.abbreviation)}
              </dd>
            </div>
          ) : null}
          {material?.url ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                URL
              </dt>
              <dd className="mt-1">
                <a
                  href={material.url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-orange text-sm"
                >
                  {String(material.url)}
                </a>
              </dd>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
