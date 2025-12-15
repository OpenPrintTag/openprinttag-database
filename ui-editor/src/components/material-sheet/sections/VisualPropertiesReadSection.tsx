import type { SchemaField } from '~/components/SchemaFields';
import { ValueDisplay } from '~/components/ValueDisplay';

import type { Material } from '../types';

interface VisualPropertiesReadSectionProps {
  material?: Material;
  fields: Record<string, unknown> | null;
}

export const VisualPropertiesReadSection = ({
  material,
  fields,
}: VisualPropertiesReadSectionProps) => {
  if (
    !material?.primary_color &&
    (!material?.secondary_colors || material.secondary_colors.length === 0)
  ) {
    return null;
  }

  return (
    <div className="card">
      <div className="card-header">Visual Properties</div>
      <div className="card-body">
        <div className="space-y-4">
          {material?.primary_color && (
            <div>
              <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                Primary Color
              </dt>
              <dd className="mt-2">
                <ValueDisplay
                  value={material.primary_color}
                  field={fields?.primary_color as SchemaField | undefined}
                />
              </dd>
            </div>
          )}
          {material?.secondary_colors &&
          material.secondary_colors.length > 0 ? (
            <div>
              <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                Secondary Colors
              </dt>
              <dd className="mt-2">
                <ValueDisplay
                  value={material.secondary_colors}
                  field={fields?.secondary_colors as SchemaField | undefined}
                />
              </dd>
            </div>
          ) : null}
          {material?.transmission_distance ? (
            <div>
              <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                Transmission Distance
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {String(material.transmission_distance)} mm
              </dd>
            </div>
          ) : null}
          {material?.refractive_index ? (
            <div>
              <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                Refractive Index
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {String(material.refractive_index)}
              </dd>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
