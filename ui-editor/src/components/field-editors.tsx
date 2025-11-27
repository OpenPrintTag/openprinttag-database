import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { safeStringify } from '~/utils/format';

import { FormField } from './FormField';

// Types
interface ColorValue {
  rgba?: string;
  color_rgba?: string;
}

interface BaseFieldEditorProps {
  label: string;
  required?: boolean;
}

interface ColorPickerProps extends BaseFieldEditorProps {
  value: unknown;
  onChange: (val: ColorValue | null) => void;
  hideLabel?: boolean;
  actions?: React.ReactNode;
  allowInvalidInput?: boolean;
}

interface ColorArrayPickerProps extends BaseFieldEditorProps {
  value: unknown;
  onChange: (val: ColorValue[] | null) => void;
}

interface JsonEditorProps {
  label: string;
  value: unknown;
  onChange: (val: unknown) => void;
}

// Constants
const VALID_HEX_PATTERN = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const DEFAULT_COLOR: ColorValue = {
  rgba: '#000000ff',
  color_rgba: '#000000ff',
};

// Utility functions
const extractHexFromValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const obj = value as ColorValue;
    return obj.rgba || obj.color_rgba || '';
  }
  return '';
};

const isValidHex = (hex: string): boolean => VALID_HEX_PATTERN.test(hex);

const wrapValue = (hex: string): ColorValue => ({ rgba: hex, color_rgba: hex });

// Extract RGB (6-char) and alpha from hex string
const parseHexWithAlpha = (hex: string): { rgb: string; alpha: number } => {
  if (!hex || hex.length < 7) {
    return { rgb: '#000000', alpha: 100 };
  }
  const rgb = hex.slice(0, 7).toLowerCase();
  if (hex.length === 9) {
    const alphaHex = hex.slice(7, 9);
    const alphaValue = parseInt(alphaHex, 16);
    return { rgb, alpha: Math.round((alphaValue / 255) * 100) };
  }
  return { rgb, alpha: 100 };
};

// Combine RGB and alpha into 8-char hex
const combineRgbAlpha = (rgb: string, alphaPercent: number): string => {
  const alphaValue = Math.round((alphaPercent / 100) * 255);
  const alphaHex = alphaValue.toString(16).padStart(2, '0');
  return `${rgb}${alphaHex}`.toLowerCase();
};

// Components
export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  required,
  hideLabel = false,
  actions,
  allowInvalidInput = true,
}) => {
  const currentHex = extractHexFromValue(value);
  const [hex, setHex] = useState(currentHex);

  const { rgb, alpha } = useMemo(() => parseHexWithAlpha(hex), [hex]);

  useEffect(() => {
    setHex(currentHex);
  }, [currentHex]);

  const handleColorChange = useCallback(
    (newHex: string) => {
      if (!allowInvalidInput && newHex && !isValidHex(newHex)) return;

      setHex(newHex);

      if (newHex && isValidHex(newHex)) {
        onChange(wrapValue(newHex));
      } else if (!newHex) {
        onChange(null);
      }
    },
    [allowInvalidInput, onChange],
  );

  const handleRgbChange = useCallback(
    (newRgb: string) => handleColorChange(combineRgbAlpha(newRgb, alpha)),
    [alpha, handleColorChange],
  );

  const handleAlphaChange = useCallback(
    (newAlpha: number) => handleColorChange(combineRgbAlpha(rgb, newAlpha)),
    [rgb, handleColorChange],
  );

  const content = (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={rgb}
          onChange={(e) => handleRgbChange(e.target.value)}
          className="h-10 w-20 cursor-pointer rounded border border-gray-300"
        />
        <input
          type="text"
          className="input font-mono text-sm"
          placeholder="#RRGGBBAA"
          value={hex}
          onChange={(e) => handleColorChange(e.target.value)}
          pattern={VALID_HEX_PATTERN.source}
        />
        {actions}
      </div>
      <div className="flex items-center gap-2">
        <label className="w-16 text-xs text-gray-600">Opacity:</label>
        <input
          type="range"
          min="0"
          max="100"
          value={alpha}
          onChange={(e) => handleAlphaChange(Number(e.target.value))}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-200"
        />
        <span className="w-10 text-right text-xs text-gray-600">{alpha}%</span>
      </div>
    </div>
  );

  if (hideLabel) return content;

  return (
    <FormField label={label} required={required}>
      {content}
    </FormField>
  );
};

export const ColorArrayPicker: React.FC<ColorArrayPickerProps> = ({
  label,
  value,
  onChange,
  required,
}) => {
  const colors: ColorValue[] = Array.isArray(value) ? value : [];

  const updateColors = (newColors: ColorValue[]) => {
    onChange(newColors.length > 0 ? newColors : null);
  };

  const handleAdd = () => updateColors([...colors, { ...DEFAULT_COLOR }]);

  const handleRemove = (index: number) =>
    updateColors(colors.filter((_, i) => i !== index));

  const handleUpdate = (index: number, newColor: ColorValue | null) => {
    if (!newColor) return;
    const newColors = [...colors];
    newColors[index] = newColor;
    updateColors(newColors);
  };

  return (
    <FormField label={label} required={required}>
      <div className="space-y-2">
        {colors.map((color, index) => (
          <ColorPicker
            key={index}
            label={`${label}-${index}`}
            value={color}
            onChange={(val) => handleUpdate(index, val)}
            required={required}
            hideLabel
            allowInvalidInput={false}
            actions={
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="btn-secondary text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            }
          />
        ))}
        <button type="button" onClick={handleAdd} className="btn-secondary">
          Add Color
        </button>
      </div>
    </FormField>
  );
};

export const JsonEditor: React.FC<JsonEditorProps> = ({
  label,
  value,
  onChange,
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const txt = e.target.value;
      try {
        onChange(JSON.parse(txt));
      } catch {
        onChange(txt);
      }
    },
    [onChange],
  );

  return (
    <FormField label={label}>
      <textarea
        className="textarea font-mono text-xs"
        rows={6}
        value={safeStringify(value)}
        onChange={handleChange}
      />
    </FormField>
  );
};

// Re-export ColorValue type for use in other components
export type { ColorValue };
