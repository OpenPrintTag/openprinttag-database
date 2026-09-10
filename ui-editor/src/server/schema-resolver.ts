import { FIELD_RELATION_MAP } from '~/server/data/schema-metadata';

type ReadFileFn = (path: string) => Promise<string>;

/**
 * A JSON-schema-like node as it appears in the raw entity schemas, including
 * our custom `x-*` annotations and composition keywords. Kept intentionally
 * permissive (index signature) because the on-disk schemas carry extra vendor
 * keys we pass through untouched.
 */
export interface JsonSchemaNode {
  type?: string | string[];
  title?: string;
  description?: string;
  required?: string[];
  properties?: Record<string, JsonSchemaNode>;
  items?: JsonSchemaNode;
  enum?: (string | number)[];
  const?: unknown;
  $ref?: string;
  oneOf?: JsonSchemaNode[];
  anyOf?: JsonSchemaNode[];
  /** Enriched: the singular entity name a relation field points at. */
  entity?: string;
  /** Enriched: which material/container class(es) a field belongs to. */
  'x-class'?: string | string[];
  [key: string]: unknown;
}

/** Path (relative to cwd) where the entity JSON schemas live. */
export const SCHEMA_DIR_RELATIVE = '../openprinttag/schema';

/**
 * Validate an entity name before it is interpolated into a file path.
 * Guards the schema routes against path traversal (`../`, absolute paths, …).
 */
export function isValidEntityName(
  entity: string | null | undefined,
): entity is string {
  return typeof entity === 'string' && /^[a-zA-Z0-9_]+$/.test(entity);
}

const EXCLUDED_FIELDS = ['connector'];

/**
 * Fields that are class-specific but not part of a oneOf/anyOf composition
 * in the schema. The resolver applies x-class annotations for these so
 * that the client only needs to check x-class — this is the single source
 * of truth for "which fields belong to which class"; the client never
 * hard-codes class checks.
 */
const FIELD_CLASS_OVERRIDES: Record<string, string[]> = {
  type: ['FFF'],
  transmission_distance: ['FFF'],
  refractive_index: ['FFF'],
  print_sheet_compatibility: ['FFF'],
};

/**
 * Resolve $ref pointers, flatten oneOf/anyOf class discriminators,
 * annotate class-specific properties with x-class, and enrich
 * relation fields with entity metadata.
 */
export async function resolveSchema(
  schema: JsonSchemaNode,
  schemaDir: string,
  readFile: ReadFileFn,
): Promise<JsonSchemaNode> {
  const cache: Record<string, JsonSchemaNode> = {};
  const result: JsonSchemaNode = { ...schema };

  // Resolve $ref for property values that are references (like material.properties)
  if (result.properties) {
    result.properties = { ...result.properties };
    for (const [key, value] of Object.entries(result.properties)) {
      if (value && typeof value === 'object' && value.$ref) {
        const resolved = await loadRef(value.$ref, schemaDir, readFile, cache);
        if (resolved) {
          const flattened = await flattenComposition(
            resolved,
            schemaDir,
            readFile,
            cache,
          );
          result.properties[key] = flattened;
        }
      }
    }
  }

  // Flatten top-level oneOf with class discriminators
  if (result.oneOf) {
    await flattenOneOf(result, schemaDir, readFile, cache);
  }

  // Apply class overrides for fields not covered by schema composition
  applyClassOverrides(result);

  // Enrich relation fields with entity metadata
  enrichEntityMetadata(result);

  // Deduplicate enum arrays
  deduplicateEnums(result);

  return result;
}

async function loadRef(
  ref: string,
  schemaDir: string,
  readFile: ReadFileFn,
  cache: Record<string, JsonSchemaNode>,
): Promise<JsonSchemaNode | null> {
  if (cache[ref]) return cache[ref];
  try {
    const content = await readFile(`${schemaDir}/${ref}`);
    const parsed = JSON.parse(content) as JsonSchemaNode;
    cache[ref] = parsed;
    return parsed;
  } catch (err: unknown) {
    // File not found is expected (e.g., relation refs) — return null
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code?: unknown }).code === 'ENOENT'
    ) {
      return null;
    }
    // Re-throw parse errors and unexpected failures
    throw err;
  }
}

function inferClassFromFilename(ref: string): string | null {
  if (ref.startsWith('fff_')) return 'FFF';
  if (ref.startsWith('sla_')) return 'SLA';
  console.warn(
    `Schema resolver: cannot infer class from filename "${ref}". ` +
      'Properties will be treated as shared.',
  );
  return null;
}

async function flattenOneOf(
  schema: JsonSchemaNode,
  schemaDir: string,
  readFile: ReadFileFn,
  cache: Record<string, JsonSchemaNode>,
): Promise<void> {
  const classProperties: Record<string, Record<string, JsonSchemaNode>> = {};

  for (const entry of schema.oneOf ?? []) {
    const classValue = entry.properties?.class?.const;
    const ref = entry.$ref;
    if (typeof classValue !== 'string' || !ref) continue;

    const resolved = await loadRef(ref, schemaDir, readFile, cache);
    if (!resolved?.properties) continue;

    classProperties[classValue] = { ...resolved.properties };
  }

  const allClassKeys = new Set<string>();
  const keyToClasses: Record<string, string[]> = {};

  for (const [cls, props] of Object.entries(classProperties)) {
    for (const key of Object.keys(props)) {
      if (EXCLUDED_FIELDS.includes(key)) continue;
      allClassKeys.add(key);
      if (!keyToClasses[key]) keyToClasses[key] = [];
      keyToClasses[key].push(cls);
    }
  }

  const allClasses = Object.keys(classProperties);
  const properties = (schema.properties ??= {});

  for (const key of allClassKeys) {
    const classes = keyToClasses[key];
    const sourceClass = classes[0];
    const propDef: JsonSchemaNode = { ...classProperties[sourceClass][key] };

    if (classes.length < allClasses.length) {
      propDef['x-class'] = classes.length === 1 ? classes[0] : classes;
    }

    // Only add class-specific fields that don't collide with base schema properties.
    // When the same key exists in multiple class schemas (e.g. `width`), it uses the
    // first class's definition — assumes identical type across classes.
    if (!properties[key]) {
      properties[key] = propDef;
    }
  }

  delete schema.oneOf;
}

async function flattenComposition(
  schema: JsonSchemaNode,
  schemaDir: string,
  readFile: ReadFileFn,
  cache: Record<string, JsonSchemaNode>,
): Promise<JsonSchemaNode> {
  if (!schema.anyOf && !schema.oneOf) return schema;

  const entries = schema.anyOf ?? schema.oneOf ?? [];

  const mergedProperties: Record<string, JsonSchemaNode> = {
    ...(schema.properties || {}),
  };

  const keyToClasses: Record<string, string[]> = {};
  const allClasses: string[] = [];

  for (const entry of entries) {
    const ref = entry.$ref;
    if (!ref) continue;

    const constValue = entry.properties?.class?.const;
    const cls =
      typeof constValue === 'string' ? constValue : inferClassFromFilename(ref);
    if (cls) allClasses.push(cls);

    const resolved = await loadRef(ref, schemaDir, readFile, cache);
    if (!resolved?.properties) continue;

    for (const [key, value] of Object.entries(resolved.properties)) {
      if (EXCLUDED_FIELDS.includes(key)) continue;

      if (!mergedProperties[key]) {
        mergedProperties[key] = { ...value };
      }

      if (cls) {
        if (!keyToClasses[key]) keyToClasses[key] = [];
        keyToClasses[key].push(cls);
      }
    }
  }

  for (const [key, classes] of Object.entries(keyToClasses)) {
    if (schema.properties?.[key]) continue;

    if (classes.length < allClasses.length) {
      mergedProperties[key]['x-class'] =
        classes.length === 1 ? classes[0] : classes;
    }
  }

  const result: JsonSchemaNode = {
    type: 'object',
    properties: mergedProperties,
  };

  if (schema.title) result.title = schema.title;
  if (schema.description) result.description = schema.description;
  if (schema.required) result.required = schema.required;

  return result;
}

function applyClassOverrides(schema: JsonSchemaNode): void {
  if (!schema.properties) return;
  for (const [key, field] of Object.entries(schema.properties)) {
    const override = FIELD_CLASS_OVERRIDES[key];
    if (
      override &&
      field &&
      typeof field === 'object' &&
      !('x-class' in field)
    ) {
      field['x-class'] = override.length === 1 ? override[0] : override;
    }
  }
}

function enrichEntityMetadata(schema: JsonSchemaNode): void {
  if (!schema.properties || typeof schema.properties !== 'object') return;
  for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
    const relation = FIELD_RELATION_MAP[fieldName];
    if (relation && typeof fieldSchema === 'object' && fieldSchema !== null) {
      fieldSchema.entity = relation.entity.replace(/s$/, '');
    }
  }
}

function deduplicateEnums(schema: JsonSchemaNode): void {
  if (!schema.properties) return;
  for (const field of Object.values(schema.properties)) {
    if (field && typeof field === 'object' && Array.isArray(field.enum)) {
      field.enum = [...new Set(field.enum)];
    }
  }
}
