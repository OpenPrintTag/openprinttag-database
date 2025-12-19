import { CardGridSkeleton } from '~/shared/components/card-skeleton';

interface PackageCardGridSkeletonProps {
  count?: number;
}

export const PackageCardGridSkeleton = ({
  count = 12,
}: PackageCardGridSkeletonProps) => <CardGridSkeleton count={count} />;
