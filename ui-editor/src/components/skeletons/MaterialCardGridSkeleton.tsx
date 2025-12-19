import { CardGridSkeleton } from '~/shared/components/card-skeleton';

interface MaterialCardGridSkeletonProps {
  count?: number;
}

export const MaterialCardGridSkeleton = ({
  count = 12,
}: MaterialCardGridSkeletonProps) => <CardGridSkeleton count={count} />;
