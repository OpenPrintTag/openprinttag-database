import fs from 'node:fs/promises';
import path from 'node:path';

import { slugifyName } from '~/utils/slug';

// Utility: locate the data directory
export async function findDataDir(): Promise<string | null> {
  const candidates = [
    path.resolve(process.cwd(), 'data'),
    path.resolve(process.cwd(), '..', 'data'),
  ];

  for (const p of candidates) {
    try {
      const stat = await fs.stat(p);
      if (stat.isDirectory()) return p;
    } catch {
      // ignore and continue
    }
  }
  return null;
}

// Utility: locate an entity directory like data/{entity}
export async function findEntityDir(
  entity: string,
  createIfMissing = false,
): Promise<string | null> {
  const candidates = [
    path.resolve(process.cwd(), 'data', entity),
    path.resolve(process.cwd(), '..', 'data', entity),
    path.resolve(process.cwd(), 'openprinttag', entity),
    path.resolve(process.cwd(), '..', 'openprinttag', entity),
  ];

  for (const p of candidates) {
    try {
      const stat = await fs.stat(p);
      if (stat.isDirectory()) return p;
    } catch {
      // ignore and continue
    }
  }

  // Directory not found - create it if requested
  if (createIfMissing) {
    const dataDir = await findDataDir();
    if (dataDir) {
      const newDir = path.join(dataDir, entity);
      await fs.mkdir(newDir, { recursive: true });
      return newDir;
    }
  }

  return null;
}

async function parseYaml(content: string): Promise<any> {
  try {
    const mod = (await import('yaml').catch(() => null as any)) as any;
    if (mod && typeof mod.parse === 'function') {
      return mod.parse(content);
    }
  } catch {
    // fall through to fallback
  }

  // Fallback: very naive YAML line parser for simple key: value pairs
  const obj: Record<string, any> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value: any = line.slice(idx + 1).trim();
    if (value === 'null' || value === '~') value = null;
    else if (/^['"].*['"]$/.test(value)) value = value.slice(1, -1);
    obj[key] = value;
  }
  return obj;
}

export interface ReadOptions {
  // Optionally filter files by name; return true to include
  fileFilter?: (fileName: string) => boolean;
  // Minimal validation; return true to include the parsed object
  validate?: (obj: any) => boolean;
}

/**
 * INTERNAL HELPERS
 */

async function getEntityFiles(
  dir: string,
  opts: ReadOptions = {},
): Promise<any[]> {
  try {
    const fileNames = await fs.readdir(dir);
    const yamlFiles = fileNames.filter(
      (f) => /\.ya?ml$/i.test(f) && (!opts.fileFilter || opts.fileFilter(f)),
    );

    const results: any[] = [];
    for (const file of yamlFiles) {
      try {
        const fullPath = path.join(dir, file);
        const content = await fs.readFile(fullPath, 'utf8');
        const parsed = await parseYaml(content);
        if (opts.validate && !opts.validate(parsed)) continue;
        results.push({ __file: file, ...parsed });
      } catch (err) {
        console.warn(`Failed to parse file ${file} in ${dir}:`, err);
      }
    }
    return results;
  } catch (_err) {
    return [];
  }
}

function matchesId(entity: any, id: string): boolean {
  if (!entity || !id) return false;
  const fileStem =
    typeof entity.__file === 'string'
      ? entity.__file.replace(/\.(ya?ml)$/i, '')
      : undefined;
  const nameSlug = slugifyName(entity.name);
  return (
    entity.slug === id ||
    fileStem === id ||
    nameSlug === id ||
    String(entity.uuid) === id
  );
}

async function findBrandDir(
  brandId: string,
  entityDirName: string,
  createIfMissing = false,
): Promise<string | null> {
  const root = await findEntityDir(entityDirName, createIfMissing);
  if (!root) return null;

  // Try exact brandId folder first (it is common that brandId IS already the slug)
  const p = path.join(root, brandId);
  try {
    const stat = await fs.stat(p);
    if (stat.isDirectory()) return p;
  } catch {}

  // Try to find the brand slug if brandId is name or uuid
  // Avoid reading all brands if we can just read the single brand by ID
  const brand = await readSingleEntity('brands', brandId);

  if (brand && !('error' in brand)) {
    const slug = brand.slug || slugifyName(brand.name);
    if (slug) {
      const slugPath = path.join(root, slug);
      try {
        const stat = await fs.stat(slugPath);
        if (stat.isDirectory()) return slugPath;
      } catch {}
      if (createIfMissing) {
        await fs.mkdir(slugPath, { recursive: true });
        return slugPath;
      }
    }
  }

  if (createIfMissing) {
    try {
      await fs.mkdir(p, { recursive: true });
      return p;
    } catch {
      return null;
    }
  }
  return null;
}

export async function readAllEntities(
  entity: string,
  opts: ReadOptions = {},
): Promise<any[] | { error: string; status?: number }> {
  const dir = await findEntityDir(entity);
  if (!dir) return { error: `${entity} directory not found`, status: 500 };
  return await getEntityFiles(dir, opts);
}

export async function countEntities(entity: string): Promise<number> {
  const dir = await findEntityDir(entity);
  if (!dir) return 0;
  try {
    const files = await fs.readdir(dir);
    return files.filter((f) => /\.ya?ml$/i.test(f)).length;
  } catch {
    return 0;
  }
}

export async function readSingleEntity(
  entity: string,
  id: string,
): Promise<any | { error: string; status?: number }> {
  const dir = await findEntityDir(entity);
  if (!dir) return { error: `${entity} directory not found`, status: 500 };

  // Try direct file access first
  const file = await findEntityFile(dir, id);
  if (file) {
    try {
      const content = await fs.readFile(file.path, 'utf8');
      const parsed = await parseYaml(content);
      // If parsed successfully, we return it.
      // We don't need matchesId here because we found the file by its slug.
      return parsed;
    } catch {
      // ignore and fall back
    }
  }

  // Fallback to reading all and matching (for cases where id might be name or uuid)
  const all = await getEntityFiles(dir);
  const match = all.find((e) => matchesId(e, id));
  if (!match) return { error: `${entity.slice(0, -1)} not found`, status: 404 };
  const { __file, ...rest } = match;
  return rest;
}

// --- Materials nested by brand helpers ---

export async function readMaterialsByBrand(
  brandId: string,
  opts: ReadOptions = {},
): Promise<any[] | { error: string; status?: number }> {
  return readNestedEntitiesByBrand('materials', brandId, opts);
}

export async function readAllMaterialsAcrossBrands(
  opts: ReadOptions = {},
): Promise<any[] | { error: string; status?: number }> {
  return readAllNestedAcrossBrands('materials', opts);
}

// --- Generic helpers for brand-nested entities ---

export async function findBrandDirForNestedEntity(
  entityDirName: string,
  brandId: string,
  createIfMissing = false,
): Promise<string | null> {
  return findBrandDir(brandId, entityDirName, createIfMissing);
}

export async function readNestedEntitiesByBrand(
  entityDirName: string,
  brandId: string,
  opts: ReadOptions = {},
): Promise<any[] | { error: string; status?: number }> {
  const dir = await findBrandDirForNestedEntity(entityDirName, brandId);
  if (!dir)
    return {
      error: `${entityDirName} for brand '${brandId}' not found`,
      status: 404,
    };
  const files = await getEntityFiles(dir, opts);
  return files.map((f) => ({ ...f, brand: { slug: brandId } }));
}

export async function readAllNestedAcrossBrands(
  entityDirName: string,
  opts: ReadOptions = {},
): Promise<any[] | { error: string; status?: number }> {
  const root = await findEntityDir(entityDirName);
  if (!root)
    return { error: `${entityDirName} directory not found`, status: 500 };

  try {
    const entries = await fs.readdir(root);
    const results: any[] = [];
    for (const entry of entries) {
      const dir = path.join(root, entry);
      const stat = await fs.stat(dir).catch(() => null);
      if (stat?.isDirectory()) {
        const items = await getEntityFiles(dir, opts);
        results.push(...items.map((f) => ({ ...f, brand: { slug: entry } })));
      }
    }
    return results;
  } catch (_err) {
    return { error: `Failed to read ${entityDirName}`, status: 500 };
  }
}

export async function countNestedEntitiesByBrand(
  entityDirName: string,
  brandId: string,
): Promise<number> {
  const dir = await findBrandDirForNestedEntity(entityDirName, brandId);
  if (!dir) return 0;
  try {
    const files = await fs.readdir(dir);
    return files.filter((f) => /\.ya?ml$/i.test(f)).length;
  } catch {
    return 0;
  }
}

export async function readSingleNestedByBrand(
  entityDirName: string,
  brandId: string,
  id: string,
): Promise<any | { error: string; status?: number }> {
  const dir = await findBrandDirForNestedEntity(entityDirName, brandId);
  if (!dir)
    return {
      error: `${entityDirName} for brand '${brandId}' not found`,
      status: 404,
    };

  // Try direct file access first
  const file = await findEntityFile(dir, id);
  if (file) {
    try {
      const content = await fs.readFile(file.path, 'utf8');
      const parsed = await parseYaml(content);
      return { ...parsed, brand: { slug: brandId } };
    } catch {
      // ignore and fall back
    }
  }

  // Fallback to reading all and matching (for cases where id might be name or uuid)
  const all = await getEntityFiles(dir);
  const match = all.find((e) => matchesId(e, id));
  if (!match) return { error: `entity not found`, status: 404 };
  const { __file, ...rest } = match;
  return { ...rest, brand: { slug: brandId } };
}

// --- Write/Update helpers ---

async function findEntityFile(
  dir: string,
  id: string,
): Promise<{ path: string; ext: string } | null> {
  for (const ext of ['.yaml', '.yml']) {
    const fullPath = path.join(dir, `${id}${ext}`);
    try {
      await fs.access(fullPath);
      return { path: fullPath, ext };
    } catch {
      // ignore and try next
    }
  }
  return null;
}

async function updateEntityFile(
  dir: string,
  id: string,
  newValue: any | null,
  createIfMissing = false,
): Promise<{ ok: true } | { error: string; status?: number }> {
  // Try direct file access first
  const file = await findEntityFile(dir, id);
  if (file) {
    try {
      if (newValue === null) {
        await fs.unlink(file.path);
      } else {
        const yamlStr = await stringifyYaml(newValue);
        await fs.writeFile(file.path, yamlStr, 'utf8');
      }
      return { ok: true };
    } catch {
      // ignore and fall back
    }
  }

  const files = await getEntityFiles(dir);
  const match = files.find((f) => matchesId(f, id));
  if (!match) {
    if (createIfMissing && newValue !== null) {
      const fullPath = path.join(dir, `${id}.yaml`);
      try {
        const yamlStr = await stringifyYaml(newValue);
        await fs.writeFile(fullPath, yamlStr, 'utf8');
        return { ok: true };
      } catch (_err) {
        return { error: `Failed to create file`, status: 500 };
      }
    }
    return { error: `item not found`, status: 404 };
  }

  const fullPath = path.join(dir, match.__file);
  try {
    if (newValue === null) {
      await fs.unlink(fullPath);
    } else {
      const yamlStr = await stringifyYaml(newValue);
      await fs.writeFile(fullPath, yamlStr, 'utf8');
    }
    return { ok: true };
  } catch (_err) {
    return { error: `Failed to update file`, status: 500 };
  }
}

export async function writeSingleEntity(
  entityDirName: string,
  id: string,
  newValue: any,
  createIfMissing = false,
) {
  const dir = await findEntityDir(entityDirName, createIfMissing);
  if (!dir)
    return { error: `${entityDirName} directory not found`, status: 500 };
  return updateEntityFile(dir, id, newValue, createIfMissing);
}

export async function deleteSingleEntity(entityDirName: string, id: string) {
  const dir = await findEntityDir(entityDirName);
  if (!dir)
    return { error: `${entityDirName} directory not found`, status: 500 };
  return updateEntityFile(dir, id, null);
}

export async function writeNestedByBrand(
  entityDirName: string,
  brandId: string,
  id: string,
  newValue: any,
  createIfMissing = false,
) {
  const dir = await findBrandDirForNestedEntity(
    entityDirName,
    brandId,
    createIfMissing,
  );
  if (!dir)
    return { error: `${entityDirName} brand directory not found`, status: 500 };
  return updateEntityFile(dir, id, newValue, createIfMissing);
}

export async function deleteNestedByBrand(
  entityDirName: string,
  brandId: string,
  id: string,
) {
  const dir = await findBrandDirForNestedEntity(entityDirName, brandId);
  if (!dir)
    return { error: `${entityDirName} brand directory not found`, status: 500 };
  return updateEntityFile(dir, id, null);
}

const NEW_ENUMS = [
  'material_certifications',
  'material_tags',
  'material_types',
  'material_tag_categories',
  'material_photo_types',
  'brand_link_pattern_types',
  'countries',
];

export async function stringifyYaml(obj: any): Promise<string> {
  let result: string;
  try {
    const mod = (await import('yaml').catch(() => null as any)) as any;
    if (mod && typeof mod.stringify === 'function') {
      result = mod.stringify(obj, {
        defaultKeyType: 'PLAIN',
        singleQuote: true,
        indentSeq: false,
      });
    } else {
      // Very naive fallback to JSON with a header comment indicating YAML fallback
      const header =
        '# NOTE: YAML library unavailable at runtime, writing JSON-like content as a fallback.\n';
      result = header + JSON.stringify(obj, null, 2);
    }
  } catch (_e) {
    const header =
      '# NOTE: YAML library unavailable at runtime, writing JSON-like content as a fallback.\n';
    result = header + JSON.stringify(obj, null, 2);
  }

  // POSIX convention: files should end with a newline
  if (!result.endsWith('\n')) {
    result += '\n';
  }
  return result;
}

// --- Lookup table helpers (single YAML file with an array under a top-level key) ---
export async function readLookupTable(
  tableName: string,
): Promise<
  { items: any[]; meta: { key: string } } | { error: string; status?: number }
> {
  if (NEW_ENUMS.includes(tableName)) {
    const filePath = path.join(
      process.cwd(),
      '../openprinttag/data',
      `${tableName}.yaml`,
    );
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = await parseYaml(content);
      if (!Array.isArray(data)) {
        return {
          error: 'Invalid lookup table file (expected array)',
          status: 500,
        };
      }
      return { items: data, meta: { key: 'items' } };
    } catch (_err) {
      return { error: 'Lookup table not found', status: 404 };
    }
  }

  return { error: 'Lookup table not found', status: 404 };
}

export async function listLookupTables(): Promise<
  string[] | { error: string; status?: number }
> {
  const files: string[] = [...NEW_ENUMS];
  return files.sort((a, b) => a.localeCompare(b));
}
