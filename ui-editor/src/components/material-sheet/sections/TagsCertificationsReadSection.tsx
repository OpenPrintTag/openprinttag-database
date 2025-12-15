import { Badge } from '~/components/ui/badge';

import type { Material } from '../types';

interface TagsCertificationsReadSectionProps {
  material?: Material;
}

export const TagsCertificationsReadSection = ({
  material,
}: TagsCertificationsReadSectionProps) => {
  if (!material?.tags?.length && !material?.certifications?.length) {
    return null;
  }

  return (
    <div className="card">
      <div className="card-header">Classification & Certifications</div>
      <div className="card-body">
        <div className="space-y-4">
          {material?.tags && material.tags.length > 0 && (
            <div>
              <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                Tags
              </dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {material.tags.map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </dd>
            </div>
          )}
          {material?.certifications && material.certifications.length > 0 && (
            <div>
              <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                Certifications
              </dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {material.certifications.map((cert: string, i: number) => (
                  <Badge
                    key={i}
                    className="bg-green-100 text-green-800 hover:bg-green-200"
                  >
                    {cert}
                  </Badge>
                ))}
              </dd>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
