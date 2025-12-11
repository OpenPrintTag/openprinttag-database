import React, { useEffect, useState } from 'react';

import { hexToCssRgba } from '~/utils/color';
import { safeStringify } from '~/utils/format';

import { FormField } from './FormField';

type ColorValue = { rgba: string } | null;

export const ColorPicker = ({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: unknown;
  onChange: (val: ColorValue) => void;
  required?: boolean;
}) => {
  const valueObj =
    value && typeof value === 'object' ? (value as { rgba?: string }) : null;
  const currentHex = valueObj?.rgba || '';
  const [hex, setHex] = useState(currentHex);

  useEffect(() => {
    setHex(currentHex);
  }, [currentHex]);

  const handleColorChange = (newHex: string) => {
    setHex(newHex);
    if (newHex && /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(newHex)) {
      onChange({ rgba: newHex });
    } else if (!newHex) {
      onChange(null);
    }
  };

  const bgColor =
    hex && /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex)
      ? (hexToCssRgba(hex) ?? '#ccc')
      : '#ccc';

  return (
    <FormField label={label} required={required}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={hex || '#000000'}
            onChange={(e) => handleColorChange(e.target.value)}
            className="h-10 w-20 cursor-pointer rounded border border-gray-300"
          />
        </div>
        <input
          type="text"
          className="input font-mono text-sm"
          placeholder="#RRGGBB or #RRGGBBAA"
          value={hex}
          onChange={(e) => handleColorChange(e.target.value)}
          pattern="^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$"
        />
        {hex && /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex) ? (
          <div
            className="h-10 w-10 rounded border border-gray-300"
            style={{ background: bgColor }}
            title={hex}
          />
        ) : null}
      </div>
    </FormField>
  );
};

export const ColorArrayPicker = ({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: unknown;
  onChange: (val: ColorValue[] | null) => void;
  required?: boolean;
}) => {
  const colors: Array<{ rgba: string }> = Array.isArray(value) ? value : [];
  const [localColors, setLocalColors] = useState(colors);

  useEffect(() => {
    setLocalColors(Array.isArray(value) ? value : []);
  }, [value]);

  const handleAddColor = () => {
    const newColors = [...localColors, { rgba: '#000000' }];
    setLocalColors(newColors);
    onChange(newColors);
  };

  const handleRemoveColor = (index: number) => {
    const newColors = localColors.filter((_, i) => i !== index);
    setLocalColors(newColors);
    onChange(newColors.length > 0 ? newColors : null);
  };

  const handleColorChange = (index: number, newHex: string) => {
    const newColors = [...localColors];
    if (/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(newHex)) {
      newColors[index] = { rgba: newHex };
      setLocalColors(newColors);
      onChange(newColors);
    }
  };

  return (
    <FormField label={label} required={required}>
      <div className="space-y-2">
        {localColors.map((color, index) => {
          const hex = color?.rgba || '#000000';
          const bgColor = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex)
            ? (hexToCssRgba(hex) ?? '#ccc')
            : '#ccc';
          return (
            <div key={index} className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={hex}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  className="h-10 w-20 cursor-pointer rounded border border-gray-300"
                />
              </div>
              <input
                type="text"
                className="input flex-1 font-mono text-sm"
                placeholder="#RRGGBB or #RRGGBBAA"
                value={hex}
                onChange={(e) => handleColorChange(index, e.target.value)}
                pattern="^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$"
              />
              <div
                className="h-10 w-10 shrink-0 rounded border border-gray-300"
                style={{ background: bgColor }}
                title={hex}
              />
              <button
                type="button"
                onClick={() => handleRemoveColor(index)}
                className="btn-secondary text-red-600 hover:text-red-800"
                aria-label="Remove color"
              >
                Remove
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={handleAddColor}
          className="btn-secondary"
        >
          Add Color
        </button>
      </div>
    </FormField>
  );
};

export const JsonEditor = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: unknown;
  onChange: (val: unknown) => void;
}) => {
  return (
    <FormField label={label}>
      <textarea
        className="textarea font-mono text-xs"
        rows={6}
        value={safeStringify(value)}
        onChange={(e) => {
          const txt = e.target.value;
          try {
            onChange(JSON.parse(txt));
          } catch {
            onChange(txt);
          }
        }}
      />
    </FormField>
  );
};
