export type EntityClass = 'FFF' | 'SLA';

/**
 * Returns Tailwind class string for FFF/SLA class badges.
 * Use with the Badge component or plain elements.
 */
export function classBadgeStyle(
  entityClass: EntityClass,
  extra?: string,
): string {
  const base =
    entityClass === 'SLA'
      ? 'border-purple-200 bg-purple-50 text-purple-700'
      : 'border-blue-200 bg-blue-50 text-blue-700';
  return extra ? `${base} ${extra}` : base;
}

/**
 * Builds a section title prefixed with the entity class when known
 * (e.g. `Properties` -> `SLA Properties`), falling back to a shared title.
 */
export function classSectionTitle(
  entityClass: string | undefined,
  classedTitle: string,
  fallback: string,
): string {
  return entityClass === 'FFF' || entityClass === 'SLA'
    ? `${entityClass} ${classedTitle}`
    : fallback;
}
