import React from 'react';

import { hexToCssRgba, parseHexRgba } from '~/utils/color';

export const ColorSwatch = ({
  rgbaHex,
  label,
  title,
}: {
  rgbaHex: string;
  label?: string;
  title?: string;
}) => {
  const bg = hexToCssRgba(rgbaHex) ?? '#ccc';
  const p = parseHexRgba(rgbaHex);
  let _contrast = '#000';
  if (p) {
    const luminance = p.r * 0.299 + p.g * 0.587 + p.b * 0.114;
    _contrast = luminance > 186 ? '#000' : '#fff';
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-xs"
      title={title ?? rgbaHex}
    >
      <span
        aria-label="color preview"
        className="inline-block rounded-sm border border-gray-300 align-middle"
        style={{ width: 14, height: 14, background: bg }}
      />
      {label ? (
        <span
          className="rounded-sm px-1 py-0.5"
          style={{
            background: '#f3f4f6',
            color: '#111827',
            border: '1px solid #e5e7eb',
          }}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
};
