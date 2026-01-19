import { Link } from '@tanstack/react-router';
import { LinkIcon } from 'lucide-react';

import { Badge } from '~/components/ui';
import { CreateButton } from '~/shared/components/action-buttons/CreateButton';

import type { Material } from '../types';

type MaterialRef =
  | {
      slug?: string;
      uuid?: string;
    }
  | string
  | null
  | undefined;

type MaterialPackage = {
  uuid?: string;
  slug?: string;
  material?: MaterialRef;
  [key: string]: unknown;
};

interface AssociatedPackagesReadSectionProps {
  material?: Material;
  brandPackages?: MaterialPackage[];
  onAddPackage?: () => void;
}

const extractMaterialKey = (val: unknown): string | null => {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (typeof obj.slug === 'string' && obj.slug) return obj.slug;
    if (typeof obj.uuid === 'string' && obj.uuid) return obj.uuid;
  }
  return null;
};

export const AssociatedPackagesReadSection = ({
  material,
  brandPackages = [],
  onAddPackage,
}: AssociatedPackagesReadSectionProps) => {
  if (!material) return null;

  const materialKeys = new Set<string>(
    [material.slug, material.uuid].filter(
      (v): v is string => typeof v === 'string' && v.length > 0,
    ),
  );

  const associatedPackages = (brandPackages ?? []).filter((pkg) => {
    if (!pkg || typeof pkg !== 'object') return false;

    const directKey = extractMaterialKey((pkg as MaterialPackage).material);
    if (directKey && materialKeys.has(directKey)) return true;

    const materialsField = (pkg as Record<string, unknown>).materials;
    if (Array.isArray(materialsField)) {
      for (const m of materialsField) {
        const k = extractMaterialKey(m);
        if (k && materialKeys.has(k)) return true;
      }
    }

    return false;
  });

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between gap-3">
        <div>Associated Packages</div>
        {onAddPackage && (
          <CreateButton onClick={onAddPackage} entityName="Package" />
        )}
      </div>

      <div className="card-body">
        {associatedPackages.length === 0 ? (
          <div className="text-sm text-gray-500">
            No packages associated with this material.
          </div>
        ) : (
          <ul className="space-y-2">
            {associatedPackages.map((pkg, index) => {
              const key = String(pkg.uuid ?? pkg.slug ?? `pkg-${index}`);
              const title = String(pkg.slug ?? pkg.uuid ?? 'Package');
              return (
                <li key={key}>
                  <Link
                    to="/brands/$brandId/packages/$packageId"
                    params={{
                      brandId: (material.brand as any)?.slug || material.brand,
                      packageId: pkg?.slug || pkg?.uuid || '',
                    }}
                  >
                    <Badge variant="secondary">
                      {title}
                      <LinkIcon className="ml-2" size={10} />
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
