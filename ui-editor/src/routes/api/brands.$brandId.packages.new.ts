import fs from 'node:fs/promises';
import path from 'node:path';

import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import { stringifyYaml } from '~/server/data/fs';
import { parseJsonSafe } from '~/server/http';
import { invalidateSearchIndex } from '~/server/searchIndex';

// POST /api/brands/$brandId/packages/new
export const Route = createFileRoute('/api/brands/$brandId/packages/new')({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const { brandId } = params;
        console.info(`POST /api/brands/${brandId}/packages/new @`, request.url);

        const body = await parseJsonSafe(request);
        if (!body.ok) return body.response;

        const payload = body.value as any;

        // Validate required fields
        // The schema uses 'material' field which can be a UUID or slug reference
        if (!payload.material && !payload.material_slug) {
          return json({ error: 'Material is required' }, { status: 400 });
        }

        try {
          const {
            findBrandDirForNestedEntity,

            readSingleEntity,
          } = await import('~/server/data/fs');
          const { generateMaterialPackageUuid } =
            await import('~/server/uuid-utils');
          // Find the brand by ID (could be slug, uuid, or name-based slug)
          const brand = await readSingleEntity('brands', brandId);

          if (!brand || !brand.uuid) {
            return json(
              { error: `Brand '${brandId}' not found or missing UUID` },
              { status: 404 },
            );
          }

          // Find the brand's material-packages directory (create if it doesn't exist)
          const brandDir = await findBrandDirForNestedEntity(
            'material-packages',
            brandId,
            true, // createIfMissing
          );
          if (!brandDir) {
            return json(
              {
                error: `Could not find or create material packages directory for brand '${brandId}'`,
              },
              { status: 500 },
            );
          }

          // Generate filename - using material and container references
          // material and container can be UUIDs or slugs
          const materialRef = payload.material?.slug || payload.material_slug;
          const containerRef =
            payload.container?.slug || payload.container_slug || 'unknown';
          const slug =
            payload.slug || `${materialRef}-${containerRef}`.toLowerCase();
          const fileName = `${slug}.yaml`;
          const filePath = path.join(brandDir, fileName);

          // Check if file already exists
          try {
            await fs.access(filePath);
            return json(
              { error: `Package with this slug already exists` },
              { status: 409 },
            );
          } catch {
            // File doesn't exist, which is what we want
          }

          // Generate UUIDv5 for the new package
          // Using GTIN if available, otherwise generate from material+container
          const gtin = payload.gtin || `${materialRef}-${containerRef}`;
          const uuid = generateMaterialPackageUuid(brand.uuid, gtin);
          // Create new package with proper field ordering
          // Use schema field names: 'material' and 'container' (not _slug variants)
          const newPackage = {
            uuid,
            slug,
            brand: { slug: brandId },
            class: payload.class || 'FFF',
            brand_specific_id: payload.brand_specific_id || undefined,
            gtin: payload.gtin || undefined,
            container: payload.container || payload.container_slug || undefined,
            material: payload.material || payload.material_slug,
            url: payload.url || undefined,
            nominal_netto_full_weight:
              payload.nominal_netto_full_weight || null,
            filament_diameter: payload.filament_diameter || null,
            filament_diameter_tolerance:
              payload.filament_diameter_tolerance || null,
            nominal_full_length: payload.nominal_full_length || null,
          };

          // Remove undefined fields
          Object.keys(newPackage).forEach((key) => {
            if (newPackage[key as keyof typeof newPackage] === undefined) {
              delete newPackage[key as keyof typeof newPackage];
            }
          });

          // Write the new package file
          const yamlStr = await stringifyYaml(newPackage);
          await fs.writeFile(filePath, yamlStr, 'utf8');

          invalidateSearchIndex();
          return json({ ok: true, package: newPackage, slug });
        } catch (err: any) {
          console.error('Failed to create package:', err);
          return json(
            { error: err?.message || 'Failed to create package' },
            { status: 500 },
          );
        }
      },
    },
  },
});
