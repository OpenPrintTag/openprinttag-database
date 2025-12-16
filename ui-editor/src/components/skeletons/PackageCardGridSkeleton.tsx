import React from 'react';

import { PackageCardSkeleton } from './PackageCardSkeleton';

interface PackageCardGridSkeletonProps {
  count?: number;
}

export const PackageCardGridSkeleton: React.FC<
  PackageCardGridSkeletonProps
> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(count)].map((_, i) => (
        <PackageCardSkeleton key={i} />
      ))}
    </div>
  );
};
