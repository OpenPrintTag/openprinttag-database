import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React from 'react';

export const Route = createFileRoute('/brands/$brandId/materials/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { brandId } = Route.useParams();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Redirect to brand page
    navigate({
      to: '/brands/$brandId',
      params: { brandId },
    });
  }, [brandId, navigate]);

  return (
    <div className="flex items-center justify-center p-8 text-gray-600">
      <div>Redirecting...</div>
    </div>
  );
}
