import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/brands/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
          <svg
            className="h-8 w-8 text-orange-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
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
