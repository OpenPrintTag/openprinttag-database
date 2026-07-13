/**
 * Returns Tailwind class string for FFF/SLA class badges.
 * Use with the Badge component or plain elements.
 */
export function classBadgeStyle(entityClass: string, extra?: string): string {
  const base =
    entityClass === 'SLA'
      ? 'border-purple-200 bg-purple-50 text-purple-700'
      : 'border-blue-200 bg-blue-50 text-blue-700';
  return extra ? `${base} ${extra}` : base;
}
