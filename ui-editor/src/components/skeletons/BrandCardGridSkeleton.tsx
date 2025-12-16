import React from 'react';

import { BrandCardSkeleton } from './BrandCardSkeleton';

interface BrandCardGridSkeletonProps {
  count?: number;
}

export const BrandCardGridSkeleton: React.FC<BrandCardGridSkeletonProps> = ({
  count = 12,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <BrandCardSkeleton key={i} />
      ))}
    </div>
  );
};
