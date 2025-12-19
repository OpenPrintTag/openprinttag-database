import fs from 'node:fs/promises';
import path from 'node:path';

// Utility: normalize a human-readable name into a kebab-case slug
export function slugifyName(input: string | null | undefined): string | null {
  if (!input) return null;
  try {
    const withNoDiacritics = input
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, ''); // remove combining marks
    return withNoDiacritics
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // drop punctuation
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');
  } catch {
    return input
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');
  }
}

// Utility: locate an entity directory like data/{entity}
export async function findEntityDir(entity: string): Promise<string | null> {
  const candidates = [
    path.resolve(process.cwd(), 'data', entity),
    path.resolve(process.cwd(), '..', 'data', entity),
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

export async function readAllEntities(
  entity: string,
  opts: ReadOptions = {},
): Promise<any[] | { error: string; status?: number }> {
  const dir = await findEntityDir(entity);
  if (!dir) return { error: `${entity} directory not found`, status: 500 };

  let fileNames: string[] = [];
  try {
    fileNames = await fs.readdir(dir);
  } catch (err) {
    console.error(`Failed to read ${entity} directory:`, err);
    return { error: `Failed to read ${entity} directory`, status: 500 };
  }

  const yamlFiles = fileNames
    .filter((f) => /\.ya?ml$/i.test(f))
    .filter((f) => (opts.fileFilter ? opts.fileFilter(f) : true));

  const results: any[] = [];
  for (const file of yamlFiles) {
    const fullPath = path.join(dir, file);
    try {
      const content = await fs.readFile(fullPath, 'utf8');
      const parsed = await parseYaml(content);
      if (opts.validate && !opts.validate(parsed)) {
        continue;
      }
      // Attach meta info that can be useful for lookups
      results.push({ __file: file, ...parsed });
    } catch (err) {
      console.warn(`Failed to parse ${entity} file:`, file, err);
    }
  }

  return results;
}

export async function readSingleEntity(
  entity: string,
  id: string,
): Promise<any | { error: string; status?: number }> {
  const all = await readAllEntities(entity);
  if (!Array.isArray(all)) return all;
  // id can be uuid, slug or file stem
  const match = all.find((e) => {
    const fileStem =
      typeof e.__file === 'string'
        ? e.__file.replace(/\.(ya?ml)$/i, '')
        : undefined;
    const nameSlug = slugifyName(e.name);
    return e.uuid === id || e.slug === id || fileStem === id || nameSlug === id;
  });
  if (!match) return { error: `${entity.slice(0, -1)} not found`, status: 404 };
  const { __file, ...rest } = match;
  return rest;
}

// --- Materials nested by brand helpers ---
// The materials are organized under data/materials/{brandId}/*.yml
// brandId is typically the brand slug, but we'll accept any provided id and look for a matching subfolder name.

export async function findMaterialsBrandDir(
  brandId: string,
): Promise<string | null> {
  const materialsRoot = await findEntityDir('materials');
  if (!materialsRoot) return null;
  // Candidate brand folder names to try: exact brandId
  const candidates: string[] = [brandId];
  // Also try the kebab-case of the brand name if we can resolve the brand by id
  try {
    const brands = await readAllEntities('brands');
    if (Array.isArray(brands)) {
      const match = brands.find((b) => {
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
      if (match) {
        const nameSlug = slugifyName(match.name);
        if (nameSlug && !candidates.includes(nameSlug))
          candidates.push(nameSlug);
        // Also consider slug if defined
        if (match.slug && !candidates.includes(match.slug))
          candidates.push(match.slug);
      }
    }
  } catch {
    // ignore lookup failures
  }
  for (const cand of candidates) {
    const p = path.join(materialsRoot, cand);
    try {
      const stat = await fs.stat(p);
      if (stat.isDirectory()) return p;
    } catch {
      // continue
    }
  }
  return null;
}

export async function readMaterialsByBrand(
  brandId: string,
  opts: ReadOptions = {},
): Promise<any[] | { error: string; status?: number }> {
  const dir = await findMaterialsBrandDir(brandId);
  if (!dir)
    return { error: `materials for brand '${brandId}' not found`, status: 404 };

  let fileNames: string[] = [];
  try {
    fileNames = await fs.readdir(dir);
  } catch (err) {
    console.error(`Failed to read materials dir for brand ${brandId}:`, err);
    return { error: `Failed to read materials for brand`, status: 500 };
  }

  const yamlFiles = fileNames
    .filter((f) => /\.(ya?ml)$/i.test(f))
    .filter((f) => (opts.fileFilter ? opts.fileFilter(f) : true));

  const results: any[] = [];
  for (const file of yamlFiles) {
    const fullPath = path.join(dir, file);
    try {
      const content = await fs.readFile(fullPath, 'utf8');
      const parsed = await parseYaml(content);
      if (opts.validate && !opts.validate(parsed)) continue;
      results.push({ __file: file, __brand: brandId, ...parsed });
    } catch (err) {
      console.warn(
        `Failed to parse material file for brand ${brandId}:`,
        file,
        err,
      );
    }
  }
  return results;
}

export async function readAllMaterialsAcrossBrands(
  opts: ReadOptions = {},
): Promise<any[] | { error: string; status?: number }> {
  const materialsRoot = await findEntityDir('materials');
  if (!materialsRoot)
    return { error: `materials directory not found`, status: 500 };

  let brandDirs: string[] = [];
  try {
    const entries = await fs.readdir(materialsRoot);
    brandDirs = entries;
  } catch (err) {
    console.error('Failed to read materials root directory:', err);
    return { error: 'Failed to read materials directory', status: 500 };
  }

  const all: any[] = [];
  for (const brandFolder of brandDirs) {
    const brandPath = path.join(materialsRoot, brandFolder);
    try {
      const st = await fs.stat(brandPath);
      if (!st.isDirectory()) continue;
    } catch {
      continue;
    }
    const items = await readMaterialsByBrand(brandFolder, opts);
    if (Array.isArray(items)) {
      all.push(...items);
    }
  }
  return all;
}

// --- Generic helpers for brand-nested entities (e.g., material-packages) ---
// These mirror the materials helpers but work for any entity directory whose
// structure is: data/{entityDir}/{brandId}/*.yml

async function findNestedParentDir(
  entityDirName: string,
): Promise<string | null> {
  return await findEntityDir(entityDirName);
}

export async function findBrandDirForNestedEntity(
  entityDirName: string,
  brandId: string,
): Promise<string | null> {
  const root = await findNestedParentDir(entityDirName);
  if (!root) return null;
  const candidates: string[] = [brandId];
  try {
    const brands = await readAllEntities('brands');
    if (Array.isArray(brands)) {
      const match = brands.find((b) => {
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
      if (match) {
        const nameSlug = slugifyName(match.name);
        if (nameSlug && !candidates.includes(nameSlug))
          candidates.push(nameSlug);
        if (match.slug && !candidates.includes(match.slug))
          candidates.push(match.slug);
      }
    }
  } catch {
    // ignore
  }
  for (const cand of candidates) {
    const p = path.join(root, cand);
    try {
      const stat = await fs.stat(p);
      if (stat.isDirectory()) return p;
    } catch {}
  }
  return null;
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

  let fileNames: string[] = [];
  try {
    fileNames = await fs.readdir(dir);
  } catch (err) {
    console.error(
      `Failed to read ${entityDirName} dir for brand ${brandId}:`,
      err,
    );
    return { error: `Failed to read ${entityDirName} for brand`, status: 500 };
  }

  const yamlFiles = fileNames
    .filter((f) => /\.(ya?ml)$/i.test(f))
    .filter((f) => (opts.fileFilter ? opts.fileFilter(f) : true));

  const results: any[] = [];
  for (const file of yamlFiles) {
    const fullPath = path.join(dir, file);
    try {
      const content = await fs.readFile(fullPath, 'utf8');
      const parsed = await parseYaml(content);
      if (opts.validate && !opts.validate(parsed)) continue;
      results.push({ __file: file, __brand: brandId, ...parsed });
    } catch (err) {
      console.warn(
        `Failed to parse ${entityDirName} file for brand ${brandId}:`,
        file,
        err,
      );
    }
  }
  return results;
}

export async function readAllNestedAcrossBrands(
  entityDirName: string,
  opts: ReadOptions = {},
): Promise<any[] | { error: string; status?: number }> {
  const root = await findNestedParentDir(entityDirName);
  if (!root)
    return { error: `${entityDirName} directory not found`, status: 500 };

  let brandDirs: string[] = [];
  try {
    brandDirs = (await fs.readdir(root)).filter(async (name) => {
      try {
        const stat = await fs.stat(path.join(root, name));
        return stat.isDirectory();
      } catch {
        return false as any;
      }
    }) as any;
  } catch (err) {
    console.error(`Failed to read ${entityDirName} root:`, err);
    return { error: `Failed to read ${entityDirName}`, status: 500 };
  }

  const results: any[] = [];
  for (const brandId of brandDirs) {
    const dir = path.join(root, brandId);
    let fileNames: string[] = [];
    try {
      fileNames = await fs.readdir(dir);
    } catch {
      continue;
    }
    const yamlFiles = fileNames
      .filter((f) => /\.(ya?ml)$/i.test(f))
      .filter((f) => (opts.fileFilter ? opts.fileFilter(f) : true));
    for (const file of yamlFiles) {
      const fullPath = path.join(dir, file);
      try {
        const content = await fs.readFile(fullPath, 'utf8');
        const parsed = await parseYaml(content);
        if (opts.validate && !opts.validate(parsed)) continue;
        results.push({ __file: file, __brand: brandId, ...parsed });
      } catch (err) {
        console.warn(
          `Failed to parse ${entityDirName} file for brand ${brandId}:`,
          file,
          err,
        );
      }
    }
  }
  return results;
}

export async function readSingleNestedByBrand(
  entityDirName: string,
  brandId: string,
  id: string,
): Promise<any | { error: string; status?: number }> {
  const all = await readNestedEntitiesByBrand(entityDirName, brandId);
  if (!Array.isArray(all)) return all;
  const match = all.find((e) => {
    const fileStem =
      typeof e.__file === 'string'
        ? e.__file.replace(/\.(ya?ml)$/i, '')
        : undefined;
    const nameSlug = slugifyName(e.name);
    return e.uuid === id || e.slug === id || fileStem === id || nameSlug === id;
  });
  if (!match) return { error: `entity not found`, status: 404 };
  const { __file, __brand, ...rest } = match;
  return rest;
}

// --- Write helpers for generic entities ---
export async function writeSingleEntity(
  entityDirName: string,
  id: string,
  newValue: any,
): Promise<{ ok: true } | { error: string; status?: number }> {
  const dir = await findEntityDir(entityDirName);
  if (!dir)
    return { error: `${entityDirName} directory not found`, status: 500 };
  let fileNames: string[] = [];
  try {
    fileNames = await fs.readdir(dir);
  } catch (_err) {
    return { error: `Failed to read ${entityDirName} directory`, status: 500 };
  }
  const yamlFiles = fileNames.filter((f) => /\.(ya?ml)$/i.test(f));
  const idStr = String(id);
  for (const file of yamlFiles) {
    const fullPath = path.join(dir, file);
    try {
      const content = await fs.readFile(fullPath, 'utf8');
      const obj = await parseYaml(content);
      const fileStem = file.replace(/\.(ya?ml)$/i, '');
      const nameSlug = slugifyName(obj?.name);
      const match =
        obj &&
        (String(obj.uuid) === idStr ||
          obj.slug === idStr ||
          fileStem === idStr ||
          nameSlug === idStr);
      if (match) {
        const yamlStr = await stringifyYaml(newValue);
        await fs.writeFile(fullPath, yamlStr, 'utf8');
        return { ok: true };
      }
    } catch (_err) {
      // continue scanning other files
    }
  }
  return { error: `${entityDirName} item not found`, status: 404 };
}

export async function deleteSingleEntity(
  entityDirName: string,
  id: string,
): Promise<{ ok: true } | { error: string; status?: number }> {
  const dir = await findEntityDir(entityDirName);
  if (!dir)
    return { error: `${entityDirName} directory not found`, status: 500 };
  let fileNames: string[] = [];
  try {
    fileNames = await fs.readdir(dir);
  } catch (_err) {
    return { error: `Failed to read ${entityDirName} directory`, status: 500 };
  }
  const yamlFiles = fileNames.filter((f) => /\.(ya?ml)$/i.test(f));
  const idStr = String(id);
  for (const file of yamlFiles) {
    const fullPath = path.join(dir, file);
    try {
      const content = await fs.readFile(fullPath, 'utf8');
      const obj = await parseYaml(content);
      const fileStem = file.replace(/\.(ya?ml)$/i, '');
      const nameSlug = slugifyName(obj?.name);
      const match =
        obj &&
        (String(obj.uuid) === idStr ||
          obj.slug === idStr ||
          fileStem === idStr ||
          nameSlug === idStr);
      if (match) {
        await fs.unlink(fullPath);
        return { ok: true };
      }
    } catch (_err) {
      // continue scanning other files
    }
  }
  return { error: `${entityDirName} item not found`, status: 404 };
}

export async function writeNestedByBrand(
  entityDirName: string,
  brandId: string,
  id: string,
  newValue: any,
): Promise<{ ok: true } | { error: string; status?: number }> {
  const brandDir = await findBrandDirForNestedEntity(entityDirName, brandId);
  if (!brandDir)
    return { error: `${entityDirName} brand directory not found`, status: 500 };
  let fileNames: string[] = [];
  try {
    fileNames = await fs.readdir(brandDir);
  } catch (_err) {
    return {
      error: `Failed to read ${entityDirName} brand directory`,
      status: 500,
    };
  }
  const yamlFiles = fileNames.filter((f) => /\.(ya?ml)$/i.test(f));
  const idStr = String(id);
  for (const file of yamlFiles) {
    const fullPath = path.join(brandDir, file);
    try {
      const content = await fs.readFile(fullPath, 'utf8');
      const obj = await parseYaml(content);
      const fileStem = file.replace(/\.(ya?ml)$/i, '');
      const nameSlug = slugifyName(obj?.name);
      const match =
        obj &&
        (String(obj.uuid) === idStr ||
          obj.slug === idStr ||
          fileStem === idStr ||
          nameSlug === idStr);
      if (match) {
        const yamlStr = await stringifyYaml(newValue);
        await fs.writeFile(fullPath, yamlStr, 'utf8');
        return { ok: true };
      }
    } catch (_err) {
      // continue
    }
  }
  return { error: `${entityDirName} item not found for brand`, status: 404 };
}

export async function deleteNestedByBrand(
  entityDirName: string,
  brandId: string,
  id: string,
): Promise<{ ok: true } | { error: string; status?: number }> {
  const brandDir = await findBrandDirForNestedEntity(entityDirName, brandId);
  if (!brandDir)
    return { error: `${entityDirName} brand directory not found`, status: 500 };
  let fileNames: string[] = [];
  try {
    fileNames = await fs.readdir(brandDir);
  } catch (_err) {
    return {
      error: `Failed to read ${entityDirName} brand directory`,
      status: 500,
    };
  }
  const yamlFiles = fileNames.filter((f) => /\.(ya?ml)$/i.test(f));
  const idStr = String(id);
  for (const file of yamlFiles) {
    const fullPath = path.join(brandDir, file);
    try {
      const content = await fs.readFile(fullPath, 'utf8');
      const obj = await parseYaml(content);
      const fileStem = file.replace(/\.(ya?ml)$/i, '');
      const nameSlug = slugifyName(obj?.name);
      const match =
        obj &&
        (String(obj.uuid) === idStr ||
          obj.slug === idStr ||
          fileStem === idStr ||
          nameSlug === idStr);
      if (match) {
        await fs.unlink(fullPath);
        return { ok: true };
      }
    } catch (_err) {
      // continue
    }
  }
  return { error: `${entityDirName} item not found for brand`, status: 404 };
}

// --- Lookup table helpers (single YAML file with an array under a top-level key) ---
export async function readLookupTable(
  tableName: string,
): Promise<
  { items: any[]; meta: { key: string } } | { error: string; status?: number }
> {
  const dir = await findEntityDir('lookup-tables');
  if (!dir) return { error: 'lookup-tables directory not found', status: 500 };
  const filePath = path.join(dir, `${tableName}.yaml`);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const data = await parseYaml(content);
    if (!data || typeof data !== 'object')
      return { error: 'Invalid lookup table file', status: 500 };
    // Find the first array property
    const key = Object.keys(data).find((k) => Array.isArray((data as any)[k]));
    if (!key) return { error: 'Lookup table items not found', status: 500 };
    const items = (data as any)[key] as any[];
    return { items, meta: { key } };
  } catch (_err) {
    return { error: 'Lookup table not found', status: 404 };
  }
}

export async function readLookupTableItem(
  tableName: string,
  id: string | number,
): Promise<any | { error: string; status?: number }> {
  const res = await readLookupTable(tableName);
  if ('error' in res) return res;
  const { items } = res;
  const idStr = String(id).toLowerCase();
  const match = items.find((it) => {
    const nameSlug = slugifyName((it as any)?.name);
    return (
      String((it as any)?.id) === idStr ||
      (it as any)?.code?.toLowerCase() === idStr ||
      (it as any)?.slug === idStr ||
      nameSlug === idStr
    );
  });
  if (!match) return { error: 'Lookup item not found', status: 404 };
  return match;
}

// Write helpers for lookup tables
export async function stringifyYaml(obj: any): Promise<string> {
  try {
    const mod = (await import('yaml').catch(() => null as any)) as any;
    if (mod && typeof mod.stringify === 'function') {
      return mod.stringify(obj);
    }
  } catch {
    // ignore
  }
  // Very naive fallback to JSON with a header comment indicating YAML fallback
  const header =
    '# NOTE: YAML library unavailable at runtime, writing JSON-like content as a fallback.\n';
  return header + JSON.stringify(obj, null, 2) + '\n';
}

export async function writeLookupTableItem(
  tableName: string,
  id: string | number,
  newValue: any,
): Promise<{ ok: true } | { error: string; status?: number }> {
  const dir = await findEntityDir('lookup-tables');
  if (!dir) return { error: 'lookup-tables directory not found', status: 500 };
  const filePath = path.join(dir, `${tableName}.yaml`);
  let data: any;
  try {
    const content = await fs.readFile(filePath, 'utf8');
    data = await parseYaml(content);
  } catch (_err) {
    return { error: 'Lookup table not found', status: 404 };
  }
  if (!data || typeof data !== 'object')
    return { error: 'Invalid lookup table file', status: 500 };
  const arrayKey = Object.keys(data).find((k) =>
    Array.isArray((data as any)[k]),
  );
  if (!arrayKey) return { error: 'Lookup table items not found', status: 500 };
  const items: any[] = (data as any)[arrayKey] as any[];

  const idStr = String(id);
  const idx = items.findIndex((it) => {
    const nameSlug = slugifyName((it as any)?.name);
    return (
      String((it as any)?.id) === idStr ||
      (it as any)?.slug === idStr ||
      nameSlug === idStr
    );
  });
  if (idx === -1) return { error: 'Lookup item not found', status: 404 };

  // Preserve original ordering; replace the item
  items[idx] = newValue;

  // Write back to disk
  const payload = { [arrayKey]: items };
  try {
    const yamlStr = await stringifyYaml(payload);
    await fs.writeFile(filePath, yamlStr, 'utf8');
    return { ok: true };
  } catch (err) {
    console.error('Failed to write lookup table item:', err);
    return { error: 'Failed to write lookup table item', status: 500 };
  }
}

export async function listLookupTables(): Promise<
  string[] | { error: string; status?: number }
> {
  const dir = await findEntityDir('lookup-tables');
  if (!dir) return { error: 'lookup-tables directory not found', status: 500 };
  try {
    const files = await fs.readdir(dir);
    return files
      .filter((f) => /\.ya?ml$/i.test(f))
      .map((f) => f.replace(/\.ya?ml$/i, ''))
      .sort((a, b) => a.localeCompare(b));
  } catch (_err) {
    return { error: 'Failed to list lookup tables', status: 500 };
  }
}
