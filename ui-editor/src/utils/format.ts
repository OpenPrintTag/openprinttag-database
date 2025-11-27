import { capitalCase } from 'change-case';

export const humanize = (k: string): string => capitalCase(k);

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

/**
 * Format bytes to human-readable string (B, KB, MB).
 * Example: 1536 → "1.5 KB"
 */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
