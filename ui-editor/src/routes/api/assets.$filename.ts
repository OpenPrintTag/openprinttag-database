import fs from 'node:fs/promises';
import path from 'node:path';

import { createFileRoute } from '@tanstack/react-router';

import { findDataDir } from '~/server/data/fs';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

export const Route = createFileRoute('/api/assets/$filename')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { filename } = params;

        if (
          !filename ||
          filename.includes('..') ||
          filename.includes('/') ||
          filename.includes('\\')
        ) {
          return new Response('Invalid filename', { status: 400 });
        }

        const dataDir = await findDataDir();
        if (!dataDir) {
          return new Response('Data directory not found', { status: 500 });
        }

        const filePath = path.join(dataDir, 'tmp', 'assets', filename);

        try {
          const buffer = await fs.readFile(filePath);
          const ext = path.extname(filename).toLowerCase();
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';

          return new Response(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000',
            },
          });
        } catch (err: any) {
          if (err.code === 'ENOENT') {
            return new Response('File not found', { status: 404 });
          }
          console.error('Failed to serve asset:', err);
          return new Response('Internal server error', { status: 500 });
        }
      },

      DELETE: async ({ params }) => {
        const { filename } = params;

        if (
          !filename ||
          filename.includes('..') ||
          filename.includes('/') ||
          filename.includes('\\')
        ) {
          return new Response('Invalid filename', { status: 400 });
        }

        const dataDir = await findDataDir();
        if (!dataDir) {
          return new Response('Data directory not found', { status: 500 });
        }

        const filePath = path.join(dataDir, 'tmp', 'assets', filename);

        try {
          await fs.unlink(filePath);
          console.info(`Deleted asset: ${filename}`);
          return new Response(null, { status: 204 });
        } catch (err) {
          if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
            // File already doesn't exist, that's fine
            return new Response(null, { status: 204 });
          }
          console.error('Failed to delete asset:', err);
          return new Response('Internal server error', { status: 500 });
        }
      },
    },
  },
});
