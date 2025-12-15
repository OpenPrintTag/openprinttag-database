import fs from 'node:fs/promises';
import path from 'node:path';

import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import { parseJsonSafe } from '~/server/http';

// POST /api/brands/$brandId/materials/new
export const Route = createFileRoute('/api/brands/$brandId/materials/new')({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const { brandId } = params;
        console.info(
          `POST /api/brands/${brandId}/materials/new @`,
          request.url,
        );

        const body = await parseJsonSafe(request);
        if (!body.ok) return body.response;

        const payload = body.value as any;

        // Validate required fields
        if (!payload.name) {
          return json({ error: 'Material name is required' }, { status: 400 });
        }

        try {
          const {
            findBrandDirForNestedEntity,
            slugifyName,
            readAllMaterialsAcrossBrands,
            readAllEntities,
          } = await import('~/server/data/fs');
          const { generateMaterialUuid } = await import('~/server/uuid-utils');

          // Find the brand to get its UUID
          const brands = await readAllEntities('brands');
          if (!Array.isArray(brands)) {
            return json({ error: 'Failed to load brands' }, { status: 500 });
          }

          // Find the brand by ID (could be slug, uuid, or name-based slug)
          const brand = brands.find((b) => {
            const fileStem =
              typeof b.__file === 'string'
                ? b.__file.replace(/\.(ya?ml)$/i, '')
                : undefined;
            const nameSlug = slugifyName(b.name);
            return (
              b.uuid === brandId ||
              b.slug === brandId ||
              fileStem === brandId ||
              nameSlug === brandId
            );
          });

          if (!brand || !brand.uuid) {
            return json(
              { error: `Brand '${brandId}' not found or missing UUID` },
              { status: 404 },
            );
          }

          // Find the brand's materials directory
          const brandDir = await findBrandDirForNestedEntity(
            'materials',
            brandId,
          );
          if (!brandDir) {
            return json(
              { error: `Materials directory for brand '${brandId}' not found` },
              { status: 404 },
            );
          }

          // Read all existing materials across all brands to check for slug duplicates
          const allMaterials = await readAllMaterialsAcrossBrands();
          const existingSlugs = new Set<string>();

          if (Array.isArray(allMaterials)) {
            allMaterials.forEach((material: any) => {
              if (material.slug) {
                existingSlugs.add(material.slug);
              }
            });
          }

          // Generate unique slug - use provided slug as base, or generate from name
          const baseSlug =
            payload.slug ||
            slugifyName(payload.name) ||
            `material-${Date.now()}`;
          let slug = baseSlug;
          let counter = 2;

          // If slug exists, append a number suffix until we find a unique one
          while (existingSlugs.has(slug)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
          }

          const fileName = `${slug}.yaml`;
          const filePath = path.join(brandDir, fileName);

          // Generate UUIDv5 for the new material
          const uuid = generateMaterialUuid(brand.uuid, payload.name);

          // Extract brand_slug from the brand
          const brandSlug = brand.slug || slugifyName(brand.name) || brandId;

          // Create new material with proper field ordering
          const newMaterial = {
            uuid,
            slug,
            brand_slug: brandSlug,
            name: payload.name,
            class: payload.class || undefined,
            type_id: payload.type_id || undefined,
            abbreviation: payload.abbreviation || '',
            primary_color: payload.primary_color || undefined,
            photos: payload.photos || [],
            properties: payload.properties || {},
          };

          // Remove undefined fields
          Object.keys(newMaterial).forEach((key) => {
            if (newMaterial[key as keyof typeof newMaterial] === undefined) {
              delete newMaterial[key as keyof typeof newMaterial];
            }
          });

          // Write the new material file
          const yamlModule = await import('yaml');
          const yamlStr = yamlModule.stringify(newMaterial);
          await fs.writeFile(filePath, yamlStr, 'utf8');

          return json({ ok: true, material: newMaterial, slug });
        } catch (err: any) {
          console.error('Failed to create material:', err);
          return json(
            { error: err?.message || 'Failed to create material' },
            { status: 500 },
          );
        }
      },
    },
  },
});
