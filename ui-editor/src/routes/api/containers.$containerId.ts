import { createFileRoute } from '@tanstack/react-router';

import {
  createDeleteHandler,
  createGetHandler,
  createPutHandler,
} from '~/server/http';

export const Route = createFileRoute('/api/containers/$containerId')({
  server: {
    middleware: [],
    handlers: {
      GET: createGetHandler('material-containers', 'containerId'),
      PUT: createPutHandler('material-containers', 'containerId'),
      DELETE: createDeleteHandler('material-containers', 'containerId'),
    },
  },
});
