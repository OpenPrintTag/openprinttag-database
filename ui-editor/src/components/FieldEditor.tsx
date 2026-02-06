import React, { memo, useMemo } from 'react';

import { useFieldOptions } from '~/hooks/useFieldOptions';
import { extractValue } from '~/utils/field';

import { ColorArrayPicker, ColorPicker, JsonEditor } from './field-editors';
import type { SchemaField } from './fieldTypes';
import { FormField } from './FormField';
import { LinkPatternEditor } from './LinkPatternEditor';
import { MultiSelect } from './MultiSelect';
import { PhotosEditor } from './PhotosEditor';
import { PropertiesEditor } from './PropertiesEditor';

// Types
interface FieldEditorProps {
  label: string;
  field: SchemaField;
  value: unknown;
  onChange: (val: unknown) => void;
  disabled?: boolean;
  brandId?: string;
}

const parseCommaSeparated = (input: string): string[] =>
  input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const CommaSeparatedInput: React.FC<{
  id?: string;
  value: string[];
  onChange: (val: string[]) => void;
  disabled?: boolean;
}> = ({ id, value, onChange, disabled }) => {
  const [localValue, setLocalValue] = React.useState(() => value.join(', '));

  React.useEffect(() => {
    setLocalValue(value.join(', '));
  }, [value]);

  return (
    <input
      id={id}
      className="input"
      type="text"
      placeholder="Comma separated"
      value={localValue}
      disabled={disabled}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => onChange(parseCommaSeparated(localValue))}
    />
  );
};

export const FieldEditor: React.FC<FieldEditorProps> = memo(
  ({ label, field, value, onChange, disabled = false, brandId }) => {
    const inputId = useMemo(() => `f_${label.replace(/\s+/g, '_')}`, [label]);
    const isRequired = !!field.required;
    const fieldOptions = useFieldOptions(label, field, brandId);
    const isReadOnly = disabled || field.type === 'uuid';
    const realLabel = isReadOnly ? `${label} (read-only)` : label;

    // 1. Relations & Enums
    if (fieldOptions.hasOptions) {
      const valueField = fieldOptions.valueField ?? 'name';
      if (fieldOptions.isArray || field.type === 'array') {
        const arr = Array.isArray(value)
          ? value.map((v) => extractValue(v, valueField))
          : [];
        return (
          <FormField label={realLabel} htmlFor={inputId} required={isRequired}>
            <MultiSelect
              id={inputId}
              options={fieldOptions.options}
              value={arr}
              onChange={(vals) =>
                onChange(
                  vals.map((v) => {
                    if (!fieldOptions.isRelation) return v;
                    return (
                      fieldOptions.options.find((o) => String(o.value) === v)
                        ?.data ?? v
                    );
                  }),
                )
              }
              disabled={disabled || fieldOptions.loading}
              placeholder={
                fieldOptions.loading ? 'Loading…' : 'Select items...'
              }
            />
          </FormField>
        );
      }

      return (
        <FormField label={realLabel} htmlFor={inputId} required={isRequired}>
          <select
            id={inputId}
            className="select"
            value={extractValue(value, valueField)}
            onChange={(e) => {
              const val = e.target.value;
              const opt = fieldOptions.options.find(
                (o) => String(o.value) === val,
              );
              onChange((opt?.data ?? val) || null);
            }}
            disabled={disabled || fieldOptions.loading}
          >
            <option value="" disabled>
              {fieldOptions.loading ? 'Loading…' : 'Select…'}
            </option>
            {fieldOptions.options.map((opt) => (
              <option key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>
      );
    }

    // 2. Special Types (Colors, Photos, Properties)
    if (field.title === 'MaterialColor' || label === 'primary_color') {
      return (
        <ColorPicker
          label={label}
          value={value}
          onChange={onChange}
          required={isRequired}
        />
      );
    }

    if (
      field.type === 'array' &&
      (field.items?.title === 'MaterialColor' || label === 'secondary_colors')
    ) {
      return (
        <ColorArrayPicker
          label={label}
          value={value}
          onChange={onChange}
          required={isRequired}
        />
      );
    }

    if (
      field.type === 'array' &&
      (field.items?.title === 'MaterialPhoto' || label === 'photos')
    ) {
      return (
        <PhotosEditor
          label={label}
          value={value}
          onChange={onChange}
          required={isRequired}
        />
      );
    }

    if (
      field.type === 'array' &&
      (field.items?.title === 'LinkPatterns' || label === 'link_patterns')
    ) {
      return (
        <LinkPatternEditor
          label={label}
          value={value}
          onChange={onChange}
          required={isRequired}
        />
      );
    }

    if (label === 'properties' && !field.properties && !field.fields) {
      return (
        <PropertiesEditor
          label={label}
          value={value}
          onChange={onChange}
          required={isRequired}
        />
      );
    }

    // 3. Primitive Types
    switch (field.type) {
      case 'boolean':
        return (
          <FormField label={label} htmlFor={inputId} required={isRequired}>
            <input
              id={inputId}
              type="checkbox"
              className="checkbox"
              checked={!!value}
              disabled={disabled}
              onChange={(e) => onChange(e.target.checked)}
            />
          </FormField>
        );

      case 'integer':
      case 'number':
        return (
          <FormField label={label} htmlFor={inputId} required={isRequired}>
            <input
              id={inputId}
              className="input"
              type="number"
              value={typeof value === 'number' ? value : ''}
              disabled={disabled}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') return onChange(null);
                const parsed =
                  field.type === 'integer'
                    ? parseInt(val, 10)
                    : parseFloat(val);
                onChange(isNaN(parsed) ? null : parsed);
              }}
            />
          </FormField>
        );

      case 'array': {
        const itemType = field.items?.type;
        if (
          !itemType ||
          ['string', 'slug', 'uuid'].includes(itemType as string)
        ) {
          return (
            <FormField
              label={realLabel}
              htmlFor={inputId}
              required={isRequired}
            >
              <CommaSeparatedInput
                id={inputId}
                value={Array.isArray(value) ? value : []}
                onChange={onChange}
                disabled={disabled}
              />
            </FormField>
          );
        }
        return <JsonEditor label={label} value={value} onChange={onChange} />;
      }

      case 'object':
        return <JsonEditor label={label} value={value} onChange={onChange} />;

      case 'uuid':
      case 'slug':
      case 'string':
      case 'rgba':
      default: {
        return (
          <FormField label={realLabel} htmlFor={inputId} required={isRequired}>
            <input
              id={inputId}
              className={`input ${isReadOnly ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''}`}
              type="text"
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => onChange(e.target.value)}
              disabled={isReadOnly}
            />
          </FormField>
        );
      }
    }
  },
);
