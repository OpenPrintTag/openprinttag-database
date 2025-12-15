import { createFileRoute } from '@tanstack/react-router';
import { Building2 } from 'lucide-react';

export const Route = createFileRoute('/brands/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
          <Building2 className="h-8 w-8 text-orange-600" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">
          Select a Brand
        </h3>
        <p className="text-sm text-gray-500">
          Choose a brand from the list to view its details, materials, and
          packages
        </p>
      </div>
    </div>
  );
}
