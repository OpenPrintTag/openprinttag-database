import { createFileRoute, useRouter } from '@tanstack/react-router';
import React from 'react';

export const Route = createFileRoute('/devices/printers/$printerId')({
  component: LegacyRedirect,
});

function LegacyRedirect() {
  const { printerId } = Route.useParams();
  const router = useRouter();
  React.useEffect(() => {
    router.navigate({ to: '/printers/$id', params: { id: String(printerId) } });
  }, [router, printerId]);
  return <div className="text-gray-600">Redirecting…</div>;
}
