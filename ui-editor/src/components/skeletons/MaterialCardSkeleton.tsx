import React from 'react';

export const MaterialCardSkeleton: React.FC = () => {
  return (
    <div className="relative h-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-linear-to-r from-gray-100 via-gray-200 to-gray-100"></div>
    </div>
  );
};
