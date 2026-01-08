import React, { useEffect, useState } from 'react';

import { safeStringify } from '~/utils/format';

import { FormField } from './FormField';

type ColorValue = { rgba?: string; color_rgba?: string } | null;

const VALID_HEX_PATTERN = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export const ColorPicker = ({
  label,
  value,
  onChange,
  required,
  hideLabel = false,
  actions,
  allowInvalidInput = true,
}: {
  label: string;
  value: unknown;
  onChange: (val: ColorValue) => void;
  required?: boolean;
  hideLabel?: boolean;
  actions?: React.ReactNode;
  allowInvalidInput?: boolean;
}) => {
  const valueObj =
    value && typeof value === 'object'
      ? (value as { rgba?: string; color_rgba?: string })
      : null;
  const currentHex =
    valueObj?.rgba ||
    valueObj?.color_rgba ||
    (typeof value === 'string' ? value : '');
  const [hex, setHex] = useState(currentHex);

  useEffect(() => {
    setHex(currentHex);
  }, [currentHex]);

  const handleColorChange = (newHex: string) => {
    if (!allowInvalidInput && newHex && !VALID_HEX_PATTERN.test(newHex)) {
      return;
    }

    setHex(newHex);

    if (newHex && VALID_HEX_PATTERN.test(newHex)) {
      onChange({ rgba: newHex, color_rgba: newHex });
    } else if (!newHex) {
      onChange(null);
    }
  };

  const colorInputValue = hex || '#000000';

  const content = (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={colorInputValue.slice(0, 7)}
        onChange={(e) => handleColorChange(e.target.value)}
        className="h-10 w-20 cursor-pointer rounded border border-gray-300"
      />
      <input
        type="text"
        className="input font-mono text-sm"
        placeholder="#RRGGBB or #RRGGBBAA"
        value={hex}
        onChange={(e) => handleColorChange(e.target.value)}
        pattern="^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$"
      />
      {actions}
    </div>
  );

  if (hideLabel) {
    return content;
  }

  return (
    <FormField label={label} required={required}>
      {content}
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
  const colors: Array<{ rgba?: string; color_rgba?: string }> = Array.isArray(
    value,
  )
    ? value
    : [];
  const [localColors, setLocalColors] = useState(colors);

  useEffect(() => {
    setLocalColors(Array.isArray(value) ? value : []);
  }, [value]);

  const handleAddColor = () => {
    const newColors = [
      ...localColors,
      { rgba: '#000000', color_rgba: '#000000' },
    ];
    setLocalColors(newColors);
    onChange(newColors);
  };

  const handleRemoveColor = (index: number) => {
    const newColors = localColors.filter((_, i) => i !== index);
    setLocalColors(newColors);
    onChange(newColors.length > 0 ? newColors : null);
  };

  const handleColorChange = (index: number, newColor: ColorValue) => {
    if (!newColor) {
      return;
    }

    const newColors = [...localColors];
    newColors[index] = newColor;
    setLocalColors(newColors);
    onChange(newColors);
  };

  return (
    <FormField label={label} required={required}>
      <div className="space-y-2">
        {localColors.map((color, index) => (
          <ColorPicker
            key={index}
            label={`${label}-${index}`}
            value={color}
            onChange={(val) => handleColorChange(index, val)}
            required={required}
            hideLabel
            allowInvalidInput={false}
            actions={
              <button
                type="button"
                onClick={() => handleRemoveColor(index)}
                className="btn-secondary text-red-600 hover:text-red-800"
                aria-label="Remove color"
              >
                Remove
              </button>
            }
          />
        ))}
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
