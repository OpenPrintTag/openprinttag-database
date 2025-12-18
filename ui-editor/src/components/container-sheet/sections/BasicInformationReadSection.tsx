import { Link } from '@tanstack/react-router';
import { ExternalLink } from 'lucide-react';

import type { Container } from '../types';

interface BasicInformationReadSectionProps {
  container?: Container;
  brandName?: string;
}

export const BasicInformationReadSection = ({
  container,
  brandName,
}: BasicInformationReadSectionProps) => {
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    return String(value);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Basic Information
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="text-sm font-medium text-gray-700">Name</div>
          <div className="mt-1 text-sm text-gray-900">
            {formatValue(container?.name)}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-700">Slug</div>
          <div className="mt-1 text-sm text-gray-900">
            {formatValue(container?.slug)}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-700">Class</div>
          <div className="mt-1 text-sm text-gray-900">
            {formatValue(container?.class)}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-700">UUID</div>
          <div className="mt-1 font-mono text-xs text-gray-900">
            {formatValue(container?.uuid)}
          </div>
        </div>
        {container?.brand_slug && (
          <div>
            <div className="text-sm font-medium text-gray-700">Brand</div>
            <div className="mt-1 text-sm">
              <Link
                to="/brands/$brandId"
                params={{ brandId: container.brand_slug }}
                className="inline-flex items-center gap-1 text-orange-600 transition-colors hover:text-orange-700 hover:underline"
              >
                {brandName || container.brand_slug}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
        {container?.brand_specific_id && (
          <div>
            <div className="text-sm font-medium text-gray-700">
              Brand Specific ID
            </div>
            <div className="mt-1 text-sm text-gray-900">
              {formatValue(container.brand_specific_id)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
