import { useMemo } from 'react';

/**
 * Pure function that filters fields by class.
 * Only checks x-class annotations (applied server-side by the schema resolver).
 * Exported separately for testing without React hooks.
 */
export function filterFieldsByClass(
  fields: Record<string, any>,
  currentClass: string | undefined,
): Record<string, any> {
  if (!currentClass) return fields;

  const result: Record<string, any> = {};
  for (const [key, field] of Object.entries(fields)) {
    const xClass = field?.['x-class'];
    if (xClass) {
      const allowed = Array.isArray(xClass) ? xClass : [xClass];
      if (!allowed.includes(currentClass)) continue;
    }

    result[key] = field;
  }
  return result;
}

/**
 * React hook that filters schema fields based on the current class value.
 * Accepts EntityFields, Record<string, any>, null, or undefined.
 */
export function useClassFields<T extends Record<string, any>>(
  fields: T | null | undefined,
  currentClass: string | undefined,
): T | undefined {
  return useMemo(() => {
    if (!fields) return undefined;
    return filterFieldsByClass(fields, currentClass) as T;
  }, [fields, currentClass]);
}
