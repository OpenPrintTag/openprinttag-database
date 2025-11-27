import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/containers')({
  component: ContainersComponent,
});

function ContainersComponent() {
  return (
    <div className="w-full">
      <Outlet />
    </div>
  );
}
