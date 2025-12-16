import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/enum')({
  component: EnumComponent,
});

function EnumComponent() {
  return (
    <div className="w-full">
      <Outlet />
    </div>
  );
}
