import fs from 'node:fs/promises';
import path from 'node:path';

import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import { findDataDir, slugifyName } from '~/server/data/fs';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export const Route = createFileRoute('/api/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        console.info('POST /api/upload @', request.url);

        try {
          const formData = await request.formData();
          const file = formData.get('file') as File | null;

          if (!file) {
            return json(
              { ok: false, error: 'No file provided' },
              { status: 400 },
            );
          }

          if (file.size > MAX_FILE_SIZE) {
            return json(
              {
                ok: false,
                error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB`,
              },
              { status: 400 },
            );
          }

          if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return json(
              {
                ok: false,
                error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
              },
              { status: 400 },
            );
          }

          const originalName = file.name;
          const ext = path.extname(originalName).toLowerCase();

          if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return json(
              {
                ok: false,
                error: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
              },
              { status: 400 },
            );
          }

          const brandSlug = formData.get('brandSlug') as string | null;
          const materialSlug = formData.get('materialSlug') as string | null;

          if (!brandSlug || !materialSlug) {
            return json(
              { ok: false, error: 'brandSlug and materialSlug are required' },
              { status: 400 },
            );
          }

          const dataDir = await findDataDir();
          if (!dataDir) {
            return json(
              { ok: false, error: 'Data directory not found' },
              { status: 500 },
            );
          }

          const safeBrandSlug = slugifyName(brandSlug) || 'unknown-brand';
          const safeMaterialSlug =
            slugifyName(materialSlug) || 'unknown-material';

          const assetsDir = path.join(
            dataDir,
            'tmp',
            'assets',
            safeBrandSlug,
            safeMaterialSlug,
          );
          await fs.mkdir(assetsDir, { recursive: true });

          const baseName = path.basename(originalName, ext);
          const slugifiedBase = slugifyName(baseName) || 'image';

          let fileName = `${slugifiedBase}${ext}`;
          let filePath = path.join(assetsDir, fileName);
          let counter = 2;

          while (await fileExists(filePath)) {
            fileName = `${slugifiedBase}-${counter}${ext}`;
            filePath = path.join(assetsDir, fileName);
            counter++;
          }

          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          await fs.writeFile(filePath, buffer);

          const relativePath = `/tmp/assets/${safeBrandSlug}/${safeMaterialSlug}/${fileName}`;

          console.info(`Uploaded file: ${relativePath}`);
          return json({ ok: true, path: relativePath });
        } catch (err: any) {
          console.error('Upload failed:', err);
          return json(
            { ok: false, error: err?.message || 'Upload failed' },
            { status: 500 },
          );
        }
      },
    },
  },
});
