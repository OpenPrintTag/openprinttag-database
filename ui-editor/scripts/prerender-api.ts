/**
 * Prerender every read-only API endpoint to a static JSON file under
 * `ui-editor/public/api/**`. Run before the static Vite build:
 *
 *   pnpm prerender:api && VITE_READ_ONLY=true pnpm build
 *
 * The client's `apiUrl()` helper rewrites `/api/foo/bar` → `/api/foo/bar.json`
 * in read-only mode, so this script must mirror the API URL shape exactly.
 *
 * What we emit:
 *   /api/brands/basic.json         — listing for sidebar + search filter
 *   /api/brands/<id>.json          — per-brand details
 *   /api/brands/<id>/materials.json
 *   /api/brands/<id>/packages.json
 *   /api/brands/<id>/counts.json
 *   /api/brands/<id>/materials/<mid>.json
 *   /api/brands/<id>/packages/<pid>.json
 *   /api/containers.json
 *   /api/containers/<id>.json
 *   /api/enum.json                 — list of enum tables
 *   /api/enum/<table>.json
 *   /api/schema/<entity>.json
 *   /api/search-index.json
 *
 * Mutating routes (PUT/POST/DELETE/upload) are intentionally NOT prerendered.
 */

import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  countNestedEntitiesByBrand,
  findDataDir,
  listLookupTables,
  readAllEntities,
  readAllMaterialsAcrossBrands,
  readAllNestedAcrossBrands,
  readLookupTable,
  readMaterialsByBrand,
  readNestedEntitiesByBrand,
  readSingleEntity,
  readSingleNestedByBrand,
} from '~/server/data/fs';
import { FIELD_RELATION_MAP } from '~/server/data/schema-metadata';
import { buildIndex } from '~/server/searchIndex';

const SCHEMA_ENTITIES = [
  'brand',
  'material',
  'material_package',
  'material_container',
];

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const UI_EDITOR_DIR = path.resolve(SCRIPT_DIR, '..');
const OUT_DIR = path.resolve(UI_EDITOR_DIR, 'public', 'api');

async function writeJson(relPath: string, value: unknown): Promise<void> {
  const fullPath = path.join(OUT_DIR, `${relPath}.json`);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, JSON.stringify(value), 'utf8');
}

function enrichSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;
  if (!schema.properties || typeof schema.properties !== 'object')
    return schema;
  const enrichedProperties: Record<string, any> = {};
  for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
    const relation = FIELD_RELATION_MAP[fieldName];
    if (relation && typeof fieldSchema === 'object' && fieldSchema !== null) {
      const entityName = relation.entity.replace(/s$/, '');
      enrichedProperties[fieldName] = {
        ...(fieldSchema as object),
        entity: entityName,
      };
    } else {
      enrichedProperties[fieldName] = fieldSchema;
    }
  }
  return { ...schema, properties: enrichedProperties };
}

async function copyDir(src: string, dst: string): Promise<void> {
  const entries = await readdir(src, { withFileTypes: true }).catch(() => []);
  if (entries.length === 0) return;
  await mkdir(dst, { recursive: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) await copyDir(s, d);
    else if (entry.isFile()) await writeFile(d, await readFile(s));
  }
}

async function main(): Promise<void> {
  console.info('Cleaning', OUT_DIR);
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const dataDir = await findDataDir();
  if (!dataDir) {
    throw new Error('Could not locate data directory — aborting prerender');
  }
  console.info('Data dir:', dataDir);

  // --- Brands (basic listing with counts) ----------------------------------
  console.info('Prerendering brands…');
  const brandsRaw = await readAllEntities('brands', {
    validate: (obj) => !!obj && (!!obj.name || !!obj.uuid),
  });
  if (!Array.isArray(brandsRaw)) {
    throw new Error(`Failed to load brands: ${brandsRaw.error ?? 'unknown'}`);
  }

  const containersRaw = await readAllEntities('material-containers', {
    validate: (obj) => !!obj && (!!obj.slug || !!obj.uuid || !!obj.name),
  });
  const containers = Array.isArray(containersRaw) ? containersRaw : [];

  const brandsBasic = await Promise.all(
    brandsRaw.map(async ({ __file: _file, ...brand }: any) => {
      const slug = brand.slug;
      const [materialCount, packageCount] = await Promise.all([
        countNestedEntitiesByBrand('materials', slug).catch(() => 0),
        countNestedEntitiesByBrand('material-packages', slug).catch(() => 0),
      ]);
      const containerCount = containers.filter(
        (c: any) => c?.brand?.slug === slug,
      ).length;
      return {
        ...brand,
        material_count: materialCount,
        package_count: packageCount,
        container_count: containerCount,
      };
    }),
  );
  await writeJson('brands/basic', brandsBasic);

  // --- Per-brand: details, materials list, packages list, counts -----------
  for (const brand of brandsRaw as any[]) {
    const slug: string | undefined = brand.slug;
    if (!slug) continue;

    const detail = await readSingleEntity('brands', slug);
    if (detail && !('error' in (detail as any))) {
      const { __file: _f, ...rest } = detail as any;
      await writeJson(`brands/${slug}`, rest);
    }

    const materials = await readMaterialsByBrand(slug, {
      validate: (obj) => !!obj && (!!obj.name || !!obj.uuid),
    });
    if (Array.isArray(materials)) {
      const stripped = materials.map(({ __file: _f, ...rest }: any) => rest);
      await writeJson(`brands/${slug}/materials`, stripped);

      for (const material of materials as any[]) {
        const mid: string | undefined = material.slug;
        if (!mid) continue;
        const m = await readSingleNestedByBrand('materials', slug, mid);
        if (m && !('error' in (m as any))) {
          const { __file: _f, ...rest } = m as any;
          await writeJson(`brands/${slug}/materials/${mid}`, rest);
        }
      }
    }

    const packages = await readNestedEntitiesByBrand(
      'material-packages',
      slug,
      {
        validate: (obj) => !!obj && (!!obj.slug || !!obj.uuid || !!obj.name),
      },
    );
    if (Array.isArray(packages)) {
      const stripped = packages.map(({ __file: _f, ...rest }: any) => rest);
      await writeJson(`brands/${slug}/packages`, stripped);

      for (const pkg of packages as any[]) {
        const pid: string | undefined = pkg.slug;
        if (!pid) continue;
        const p = await readSingleNestedByBrand('material-packages', slug, pid);
        if (p && !('error' in (p as any))) {
          const { __file: _f, ...rest } = p as any;
          await writeJson(`brands/${slug}/packages/${pid}`, rest);
        }
      }
    }

    const materialCount = Array.isArray(materials) ? materials.length : 0;
    const packageCount = Array.isArray(packages) ? packages.length : 0;
    await writeJson(`brands/${slug}/counts`, {
      brandId: slug,
      material_count: materialCount,
      package_count: packageCount,
      container_ount: 0,
    });
  }

  // --- Cross-cutting listings ---------------------------------------------
  console.info('Prerendering cross-cutting listings…');
  const allMaterials = await readAllMaterialsAcrossBrands({
    validate: (obj) => !!obj && (!!obj.name || !!obj.uuid),
  });
  if (Array.isArray(allMaterials)) {
    await writeJson(
      'materials',
      allMaterials.map(({ __file: _f, __brand, ...rest }: any) => ({
        ...rest,
        brandId: __brand || rest?.brand?.slug,
      })),
    );
  }

  const allPackages = await readAllNestedAcrossBrands('material-packages', {
    validate: (obj) => !!obj && (!!obj.slug || !!obj.uuid || !!obj.name),
  });
  if (Array.isArray(allPackages)) {
    await writeJson(
      'packages',
      allPackages.map(({ __file: _f, __brand, ...rest }: any) => ({
        ...rest,
        brandId: __brand || rest?.brand?.slug,
      })),
    );
  }

  await writeJson(
    'containers',
    containers.map(({ __file: _f, ...rest }: any) => rest),
  );
  for (const container of containers as any[]) {
    const cid: string | undefined = container.slug;
    if (!cid) continue;
    const c = await readSingleEntity('material-containers', cid);
    if (c && !('error' in (c as any))) {
      const { __file: _f, ...rest } = c as any;
      await writeJson(`containers/${cid}`, rest);
    }
  }

  // --- Enum tables ---------------------------------------------------------
  console.info('Prerendering enum tables…');
  const tables = await listLookupTables();
  if (Array.isArray(tables)) {
    await writeJson('enum', { tables });
    for (const table of tables) {
      const data = await readLookupTable(table);
      if (!('error' in (data as any))) {
        await writeJson(`enum/${table}`, data);
      }
    }
  }

  // --- Schemas -------------------------------------------------------------
  console.info('Prerendering schemas…');
  const schemaDir = path.resolve(process.cwd(), '../openprinttag/schema');
  for (const entity of SCHEMA_ENTITIES) {
    try {
      const file = path.join(schemaDir, `${entity}.schema.json`);
      const raw = await readFile(file, 'utf8');
      const parsed = JSON.parse(raw);
      await writeJson(`schema/${entity}`, enrichSchema(parsed));
    } catch (err) {
      console.warn(`Schema for "${entity}" not found at ${schemaDir}`, err);
    }
  }

  // --- Search index --------------------------------------------------------
  console.info('Prerendering search index…');
  const index = await buildIndex();
  await writeJson('search-index', index);

  // --- tmp/assets (uploaded images) ---------------------------------------
  // The /api/assets/... GET handler reads from <data-dir>/tmp/assets. In a
  // static deploy we just copy that tree to public/tmp/assets so referenced
  // image URLs (`/tmp/assets/...`) resolve directly.
  const assetsSrc = path.join(dataDir, 'tmp', 'assets');
  const assetsDst = path.resolve(UI_EDITOR_DIR, 'public', 'tmp', 'assets');
  console.info('Copying uploaded assets…');
  await copyDir(assetsSrc, assetsDst);

  console.info('Prerender complete →', OUT_DIR);
}

main().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
