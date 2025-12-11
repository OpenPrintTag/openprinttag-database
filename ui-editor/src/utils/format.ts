export const humanize = (k: string): string =>
  k
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const isPrimitive = (val: unknown): boolean =>
  typeof val === 'string' ||
  typeof val === 'number' ||
  typeof val === 'boolean' ||
  val === null;

export const isValidUrl = (str: string): boolean => {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const safeStringify = (v: unknown): string => {
  try {
    return JSON.stringify(v ?? null, null, 2);
  } catch {
    return String(v ?? '');
  }
};
