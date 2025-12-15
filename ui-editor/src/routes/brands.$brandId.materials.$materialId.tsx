import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React from 'react';

const MaterialDetailRoute = () => {
  const { brandId, materialId } = Route.useParams();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Redirect to brand page with material sheet open
    navigate({
      to: '/brands/$brandId',
      params: { brandId },
      search: { materialId },
    });
  }, [brandId, materialId, navigate]);
  return (
    <div className="flex items-center justify-center p-8 text-gray-600">
      <div>Redirecting...</div>
    </div>
  );
};

export const Route = createFileRoute('/brands/$brandId/materials/$materialId')({
  component: MaterialDetailRoute,
});

export default MaterialDetailRoute;
