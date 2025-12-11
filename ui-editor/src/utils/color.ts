export const parseHexRgba = (
  hex: string,
): { r: number; g: number; b: number; a: number } | null => {
  if (typeof hex !== 'string') return null;
  const h = hex.trim().replace(/^#/, '');
  if (!(h.length === 6 || h.length === 8)) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) : 255;
  if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
  return { r, g, b, a };
};

export const hexToCssRgba = (hex: string): string | null => {
  const p = parseHexRgba(hex);
  if (!p) return null;
  const alpha = Math.round((p.a / 255) * 100) / 100;
  return `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
};

export const hexToRgbText = (hex: string): string => {
  const p = parseHexRgba(hex);
  if (!p) return String(hex);
  return `${p.r}, ${p.g}, ${p.b}`;
};

export const isHexColor = (s: unknown): boolean =>
  typeof s === 'string' && /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s);

type ColorObject = {
  rgba?: unknown;
  hex?: unknown;
  rgb?: unknown[];
};

export const extractColorHex = (v: unknown): string | null => {
  if (!v) return null;
  if (typeof v === 'string' && isHexColor(v)) return v;
  if (typeof v === 'object' && v !== null) {
    const obj = v as ColorObject;
    if (isHexColor(obj.rgba)) return obj.rgba as string;
    if (isHexColor(obj.hex)) return obj.hex as string;
    if (Array.isArray(obj.rgb) && obj.rgb.length >= 3) {
      const [r, g, b, a] = obj.rgb;
      const alpha = typeof a === 'number' ? a : 1;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return null;
};
