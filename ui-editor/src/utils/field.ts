import { FIELD_RELATION_MAP } from '~/server/data/schema-metadata';

/**
 * Extract raw value from a field using FIELD_RELATION_MAP metadata.
 * For relation fields, extracts the valueField (e.g., slug) from the object.
 * For non-relation fields, returns the value as-is.
 */
export const extractFieldValue = (key: string, value: unknown): unknown => {
  const relationMeta = FIELD_RELATION_MAP[key];
  if (relationMeta && typeof value === 'object' && value !== null) {
    const valueField = relationMeta.valueField;
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
  if (!relationMeta) return value;

  // Handle null/undefined
  if (value === null || value === undefined) return value;

  // Handle object with enriched data
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const slugValue = obj[relationMeta.valueField];
    if (slugValue !== undefined) {
      return { [relationMeta.valueField]: slugValue };
    }
  }

  // Handle string value (already just the slug string)
  if (typeof value === 'string') {
    return { [relationMeta.valueField]: value };
  }

  return value;
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
    }
  }

  return result as T;
};
