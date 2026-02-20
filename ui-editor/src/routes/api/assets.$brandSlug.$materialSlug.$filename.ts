import fs from 'node:fs/promises';
import path from 'node:path';

import { createFileRoute } from '@tanstack/react-router';

import { findDataDir } from '~/server/data/fs';
import { slugifyName } from '~/utils/slug';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function isValidSlug(slug: string): boolean {
  return (
    !!slug &&
    !slug.includes('..') &&
    !slug.includes('/') &&
    !slug.includes('\\')
  );
}

export const Route = createFileRoute(
  '/api/assets/$brandSlug/$materialSlug/$filename',
)({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { brandSlug, materialSlug, filename } = params;

        if (
          !isValidSlug(brandSlug) ||
          !isValidSlug(materialSlug) ||
          !isValidSlug(filename)
        ) {
          return new Response('Invalid path parameters', { status: 400 });
        }

        const dataDir = await findDataDir();
        if (!dataDir) {
          return new Response('Data directory not found', { status: 500 });
        }

        const safeBrandSlug = slugifyName(brandSlug) ?? brandSlug;
        const safeMaterialSlug = slugifyName(materialSlug) ?? materialSlug;
        const filePath = path.join(
          dataDir,
          'tmp',
          'assets',
          safeBrandSlug,
          safeMaterialSlug,
          filename,
        );

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
        const { brandSlug, materialSlug, filename } = params;

        if (
          !isValidSlug(brandSlug) ||
          !isValidSlug(materialSlug) ||
          !isValidSlug(filename)
        ) {
          return new Response('Invalid path parameters', { status: 400 });
        }

        const dataDir = await findDataDir();
        if (!dataDir) {
          return new Response('Data directory not found', { status: 500 });
        }

        const safeBrandSlug = slugifyName(brandSlug) ?? brandSlug;
        const safeMaterialSlug = slugifyName(materialSlug) ?? materialSlug;
        const filePath = path.join(
          dataDir,
          'tmp',
          'assets',
          safeBrandSlug,
          safeMaterialSlug,
          filename,
        );

        try {
          await fs.unlink(filePath);
          console.info(
            `Deleted asset: ${safeBrandSlug}/${safeMaterialSlug}/${filename}`,
          );
          return new Response(null, { status: 204 });
        } catch (err) {
          if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
            return new Response(null, { status: 204 });
          }
          console.error('Failed to delete asset:', err);
          return new Response('Internal server error', { status: 500 });
        }
      },
    },
  },
});
