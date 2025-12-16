import React from 'react';

import { MaterialCardSkeleton } from './MaterialCardSkeleton';

interface MaterialCardGridSkeletonProps {
  count?: number;
}

export const MaterialCardGridSkeleton: React.FC<
  MaterialCardGridSkeletonProps
> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(count)].map((_, i) => (
        <MaterialCardSkeleton key={i} />
      ))}
    </div>
  );
};
