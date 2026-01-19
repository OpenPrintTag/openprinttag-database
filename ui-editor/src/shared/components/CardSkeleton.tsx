export const CardSkeleton = () => (
  <div className="relative h-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-linear-to-r from-gray-100 via-gray-200 to-gray-100" />
  </div>
);

interface CardGridSkeletonProps {
  count?: number;
}

export const CardGridSkeleton = ({ count = 12 }: CardGridSkeletonProps) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);
