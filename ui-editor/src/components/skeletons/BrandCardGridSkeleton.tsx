import { CardGridSkeleton } from '~/shared/components/card-skeleton';

interface BrandCardGridSkeletonProps {
  count?: number;
}

export const BrandCardGridSkeleton = ({
  count = 12,
}: BrandCardGridSkeletonProps) => <CardGridSkeleton count={count} />;
