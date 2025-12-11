import { createFileRoute, useRouter } from '@tanstack/react-router';
import React from 'react';

export const Route = createFileRoute('/devices/accessories')({
  component: LegacyRedirect,
});

function LegacyRedirect() {
  const router = useRouter();
  React.useEffect(() => {
    router.navigate({ to: '/accessories' });
  }, [router]);
  return <div className="text-gray-600">Redirecting…</div>;
}
