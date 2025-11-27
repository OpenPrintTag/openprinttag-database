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
