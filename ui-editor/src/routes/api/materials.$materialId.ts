import { createFileRoute } from '@tanstack/react-router';

import { createGetHandler } from '~/server/http';

export const Route = createFileRoute('/api/materials/$materialId')({
  server: {
    handlers: {
      GET: createGetHandler('materials', 'materialId'),
    },
  },
});
