import React from 'react';

import { CardGridSkeleton } from '~/shared/components/CardSkeleton';

export const StateDisplay = ({
  error,
  loading = false,
}: {
  error: string | null;
  loading?: boolean;
}) => {
  if (loading) return <CardGridSkeleton count={12} />;
  if (!error) return null;
  return (
    <div className="my-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {error}
    </div>
  );
};
