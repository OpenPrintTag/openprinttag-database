import fs from 'node:fs/promises';
import path from 'node:path';

import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import { stringifyYaml } from '~/server/data/fs';
import { parseJsonSafe } from '~/server/http';
import { invalidateSearchIndex } from '~/server/searchIndex';

// POST /api/containers/new
export const Route = createFileRoute('/api/containers/new')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        console.info('POST /api/containers/new @', request.url);

        const body = await parseJsonSafe(request);
        if (!body.ok) return body.response;

        const payload = body.value as any;

        // Validate required fields
        if (!payload.name) {
          return json({ error: 'Container name is required' }, { status: 400 });
        }

        if (!payload.class) {
          return json(
            { error: 'Container class is required' },
            { status: 400 },
          );
        }

        try {
          const { findEntityDir, slugifyName } =
            await import('~/server/data/fs');
          const { v4: uuidv4 } = await import('uuid');

          // Find the material-containers directory (create if it doesn't exist)
          const containersDir = await findEntityDir(
            'material-containers',
            true,
          );
          if (!containersDir) {
            return json(
              {
                error: 'Could not find or create material containers directory',
              },
              { status: 500 },
            );
          }

          // Generate slug from name or use provided slug
          const slug = payload.slug || slugifyName(payload.name);
          if (!slug) {
            return json(
              { error: 'Could not generate slug from name' },
              { status: 400 },
            );
          }

          const fileName = `${slug}.yaml`;
          const filePath = path.join(containersDir, fileName);

          // Check if file already exists
          try {
            await fs.access(filePath);
            return json(
              { error: `Container with this slug already exists` },
              { status: 409 },
            );
          } catch {
            // File doesn't exist, which is what we want
          }

          // Generate UUID v4 for the new container
          const uuid = uuidv4();

          // Create new container with proper field ordering
          const newContainer: any = {
            uuid,
            slug,
            class: payload.class,
            name: payload.name,
          };

          // Add optional fields if provided
          if (payload.brand_specific_id)
            newContainer.brand_specific_id = payload.brand_specific_id;
          if (
            payload.volumetric_capacity !== undefined &&
            payload.volumetric_capacity !== null
          )
            newContainer.volumetric_capacity = payload.volumetric_capacity;
          if (
            payload.empty_weight !== undefined &&
            payload.empty_weight !== null
          )
            newContainer.empty_weight = payload.empty_weight;
          if (
            payload.hole_diameter !== undefined &&
            payload.hole_diameter !== null
          )
            newContainer.hole_diameter = payload.hole_diameter;
          if (
            payload.inner_diameter !== undefined &&
            payload.inner_diameter !== null
          )
            newContainer.inner_diameter = payload.inner_diameter;
          if (
            payload.outer_diameter !== undefined &&
            payload.outer_diameter !== null
          )
            newContainer.outer_diameter = payload.outer_diameter;
          if (payload.width !== undefined && payload.width !== null)
            newContainer.width = payload.width;
          if (payload.length !== undefined && payload.length !== null)
            newContainer.length = payload.length;
          if (payload.height !== undefined && payload.height !== null)
            newContainer.height = payload.height;

          // Write the new container file
          const yamlStr = await stringifyYaml(newContainer);
          await fs.writeFile(filePath, yamlStr, 'utf8');

          console.info(`Created container: ${slug}`);

          invalidateSearchIndex();
          return json(newContainer, { status: 201 });
        } catch (err) {
          console.error('Error creating container:', err);
          return json(
            {
              error:
                err instanceof Error
                  ? err.message
                  : 'Failed to create container',
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
