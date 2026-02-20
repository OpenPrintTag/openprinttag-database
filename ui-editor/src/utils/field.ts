import {
  FIELD_ENUM_MAP,
  FIELD_RELATION_MAP,
} from '~/server/data/schema-metadata';

/**
 * Extract raw value from a field using FIELD_RELATION_MAP or FIELD_ENUM_MAP metadata.
 * For relation and enum fields, extracts the valueField (e.g., slug, code, abbreviation) from the object.
 * For non-mapped fields, returns the value as-is.
 */
export const extractFieldValue = (key: string, value: unknown): unknown => {
  const meta = FIELD_RELATION_MAP[key] ?? FIELD_ENUM_MAP[key];
  if (meta && typeof value === 'object' && value !== null) {
    const valueField = meta.valueField;
    return (value as Record<string, unknown>)[valueField] ?? value;
  }
  return value;
};

/**
 * Extract value from an item using the specified field.
 * No guessing - uses explicit valueField from metadata.
 */
export const extractValue = (val: unknown, valueField: string): string => {
  if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    return String(obj[valueField] ?? '');
  }
  return String(val ?? '');
};

/**
 * Strip enriched data from a relation field value, keeping only the slug.
 * Converts enriched objects like { slug: "x", name: "Y", uuid: "..." }
 * to just { slug: "x" } for saving to the backend.
 */
export const stripRelationToSlug = (key: string, value: unknown): unknown => {
  const relationMeta = FIELD_RELATION_MAP[key];
  if (!relationMeta || value === null || value === undefined) return value;

  const rawValue = extractFieldValue(key, value);
  return rawValue !== undefined && rawValue !== null
    ? { [relationMeta.valueField]: rawValue }
    : value;
};

/**
 * Prepare form data for saving by stripping enriched data from all relation fields.
 * This ensures only the slug is saved for nested entities (brand, material, container).
 */
export const prepareFormForSave = <T extends Record<string, unknown>>(
  form: T,
): T => {
  const result: Record<string, unknown> = { ...form };

  for (const key of Object.keys(result)) {
    if (FIELD_RELATION_MAP[key]) {
      result[key] = stripRelationToSlug(key, result[key]);
    } else if (FIELD_ENUM_MAP[key]) {
      result[key] = extractFieldValue(key, result[key]);
    }
  }

  return result as T;
};
