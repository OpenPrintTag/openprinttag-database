import { createFileRoute } from '@tanstack/react-router';

import { createPostHandler } from '~/server/http';

// POST /api/containers/new
export const Route = createFileRoute('/api/containers/new')({
  server: {
    handlers: {
      POST: createPostHandler('material-containers'),
    },
  },
});
