import tinycolor from 'tinycolor2';

export const parseHexRgba = (
  hex: string,
): { r: number; g: number; b: number; a: number } | null => {
  if (typeof hex !== 'string') return null;
  const color = tinycolor(hex);
  if (!color.isValid()) return null;
  const rgba = color.toRgb();
  return { r: rgba.r, g: rgba.g, b: rgba.b, a: Math.round(rgba.a * 255) };
};

export const hexToCssRgba = (hex: string): string | null => {
  const color = tinycolor(hex);
  return color.isValid() ? color.toRgbString() : null;
};

export const hexToRgbText = (hex: string): string => {
  const color = tinycolor(hex);
  if (!color.isValid()) return String(hex);
  const rgb = color.toRgb();
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
};

export const isHexColor = (s: unknown): boolean => {
  if (typeof s !== 'string') return false;
  const color = tinycolor(s);
  return (
    color.isValid() &&
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s)
  );
};

type ColorObject = {
  rgba?: unknown;
  color_rgba?: unknown;
  hex?: unknown;
  rgb?: unknown[];
};

export const extractColorHex = (v: unknown): string | null => {
  if (!v) return null;
  if (typeof v === 'string' && isHexColor(v)) return v;
  if (typeof v === 'object' && v !== null) {
    const obj = v as ColorObject;
    if (isHexColor(obj.color_rgba)) return obj.color_rgba as string;
    if (isHexColor(obj.rgba)) return obj.rgba as string;
    if (isHexColor(obj.hex)) return obj.hex as string;
    if (Array.isArray(obj.rgb) && obj.rgb.length >= 3) {
      const [r, g, b, a] = obj.rgb;
      const color = tinycolor({
        r: Number(r),
        g: Number(g),
        b: Number(b),
        a: typeof a === 'number' ? a : 1,
      });
      return color.toRgbString();
    }
  }
  return null;
};
