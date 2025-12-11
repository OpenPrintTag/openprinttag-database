import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/materials/$materialId')({
  component: DeprecatedMaterialRoute,
});

function DeprecatedMaterialRoute() {
  const { materialId } = Route.useParams();
  // This route is deprecated; materials are accessible only under brand now
  return (
    <div className="space-y-3">
      <div className="font-medium text-red-700">This route has moved.</div>
      <div className="text-gray-700">
        Materials are now nested under their Brand. Please open the brand and
        then the material.
      </div>
      <div className="flex gap-2">
        <Link to="/brands" className="btn">
          Go to Brands
        </Link>
      </div>
      <div className="text-xs text-gray-500">
        Requested material id: {materialId}
      </div>
    </div>
  );
}
