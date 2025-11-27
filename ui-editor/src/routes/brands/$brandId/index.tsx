import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/brands/$brandId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: `/brands/$brandId/materials`,
      params,
    });
  },
});
