import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/brands')({
  component: BrandsComponent,
});

function BrandsComponent() {
  return (
    <div className="w-full">
      <Outlet />
    </div>
  );
}
