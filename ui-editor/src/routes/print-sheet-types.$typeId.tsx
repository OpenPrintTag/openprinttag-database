import { createFileRoute, useRouter } from '@tanstack/react-router';
import React from 'react';

export const Route = createFileRoute('/print-sheet-types/$typeId')({
  component: LegacyRedirect,
});

function LegacyRedirect() {
  const { typeId } = Route.useParams();
  const router = useRouter();
  React.useEffect(() => {
    router.navigate({
      to: '/print-sheet-types/$slug',
      params: { slug: String(typeId) },
    });
  }, [router, typeId]);
  return <div className="text-gray-600">Redirecting…</div>;
}
