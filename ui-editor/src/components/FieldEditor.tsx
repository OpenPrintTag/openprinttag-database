import React, { useMemo } from 'react';

import { useEnumOptions } from '~/hooks/useEnumOptions';
import { useLookupRelation } from '~/hooks/useSchema';

import { ColorArrayPicker, ColorPicker, JsonEditor } from './field-editors';
import type { SchemaField } from './field-types';
import { FormField } from './FormField';
import { MultiSelect } from './MultiSelect';
import { PhotosEditor } from './PhotosEditor';
import { PropertiesEditor } from './PropertiesEditor';

export const FieldEditor = ({
  label,
  field,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  field: SchemaField;
  value: unknown;
  onChange: (val: unknown) => void;
  disabled?: boolean;
}) => {
  const inputId = useMemo(() => `f_${label.replace(/\s+/g, '_')}`, [label]);
  const type = field.type;

  const fk = field.foreign_key;
  const relation = useLookupRelation(fk);
  const relOptions = useEnumOptions(
    relation?.table ?? null,
    relation?.valueField ?? null,
  );

  // Single-value foreign key → dropdown
  if (
    fk &&
    relation?.isLookup &&
    relation?.table &&
    relation?.valueField &&
    type !== 'array'
  ) {
    const stringValue =
      typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : '';
    return (
      <FormField label={label} htmlFor={inputId} required={field.required}>
        <select
          id={inputId}
          className="select"
          value={stringValue}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled || relOptions.loading || !!relOptions.error}
        >
          <option value="" disabled>
            {relOptions.loading ? 'Loading…' : 'Select…'}
          </option>
          {relOptions.options.map((opt) => (
            <option key={opt.value} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>
        {relOptions.error ? (
          <div className="mt-1 text-[11px] text-amber-700">
            Failed to load options; using text input fallback above.
          </div>
        ) : null}
      </FormField>
    );
  }

  // Array of foreign keys → multi-select
  if (type === 'array' && field.items?.foreign_key) {
    const afk = field.items.foreign_key;
    const arelation = useLookupRelation(afk);
    const aopts = useEnumOptions(
      arelation?.table ?? null,
      arelation?.valueField ?? null,
    );
    const arr: string[] = Array.isArray(value)
      ? value.map((v: any) => String(v))
      : [];

    if (aopts.error) {
      return (
        <FormField label={label} htmlFor={inputId} required={field.required}>
          <div className="mt-1 text-[11px] text-amber-700">
            Failed to load options; using comma separated fallback below.
          </div>
          <input
            className="input mt-2"
            type="text"
            placeholder="Comma separated"
            value={arr.join(', ')}
            onChange={(e) =>
              onChange(
                e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </FormField>
      );
    }

    return (
      <FormField label={label} htmlFor={inputId} required={field.required}>
        <MultiSelect
          id={inputId}
          options={aopts.options}
          value={arr}
          onChange={onChange}
          disabled={disabled || aopts.loading || !!aopts.error}
          placeholder={aopts.loading ? 'Loading…' : 'Select items...'}
          searchPlaceholder="Search..."
        />
      </FormField>
    );
  }

  if (
    type === 'string' ||
    type === 'slug' ||
    type === 'uuid' ||
    type === 'rgba'
  ) {
    const stringValue = typeof value === 'string' ? value : '';
    const isUuid = type === 'uuid';
    const isDisabled = disabled || isUuid;
    const displayLabel = isDisabled ? `${label} (read-only)` : label;
    return (
      <FormField
        label={displayLabel}
        htmlFor={inputId}
        required={field.required}
      >
        <input
          id={inputId}
          className={`input ${isDisabled ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''}`}
          type="text"
          value={stringValue}
          maxLength={field.max_length}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          aria-disabled={isDisabled}
          title={isDisabled ? 'This field is not editable' : undefined}
        />
      </FormField>
    );
  }

  if (type === 'integer' || type === 'number') {
    const numberValue = typeof value === 'number' ? value : '';
    return (
      <FormField label={label} htmlFor={inputId} required={field.required}>
        <input
          id={inputId}
          className="input"
          type="number"
          value={numberValue}
          disabled={disabled}
          onChange={(e) => {
            if (e.target.value === '') {
              onChange(null);
            } else if (type === 'integer') {
              onChange(parseInt(e.target.value, 10));
            } else {
              onChange(parseFloat(e.target.value));
            }
          }}
        />
      </FormField>
    );
  }

  if (type === 'boolean') {
    return (
      <FormField label={label} htmlFor={inputId} required={field.required}>
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
  }

  if (type === 'enum' && Array.isArray(field.values)) {
    const enumValue = typeof value === 'string' ? value : '';
    return (
      <FormField label={label} htmlFor={inputId} required={field.required}>
        <select
          id={inputId}
          className="select"
          value={enumValue}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            {'Select…'}
          </option>
          {field.values.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </FormField>
    );
  }

  if (type === 'array') {
    const itemType = field.items?.type;
    const isPrimitiveItem =
      !itemType || ['string', 'slug', 'uuid'].includes(itemType);

    if (isPrimitiveItem) {
      const arr: string[] = Array.isArray(value) ? value : [];
      return (
        <FormField label={label} htmlFor={inputId} required={field.required}>
          <input
            id={inputId}
            className="input"
            type="text"
            placeholder="Comma separated"
            value={arr.join(', ')}
            disabled={disabled}
            onChange={(e) =>
              onChange(
                e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </FormField>
      );
    }

    // Special handling for secondary_colors
    if (
      label === 'secondary_colors' &&
      field.items?.type === 'object' &&
      field.items?.fields?.rgba?.type === 'rgba'
    ) {
      return (
        <ColorArrayPicker
          label={label}
          value={value}
          onChange={onChange}
          required={field.required}
        />
      );
    }

    // Special handling for photos
    if (
      label === 'photos' &&
      field.items?.type === 'object' &&
      field.items?.fields?.url?.type === 'url' &&
      field.items?.fields?.type?.type === 'enum'
    ) {
      return (
        <PhotosEditor
          label={label}
          value={value}
          onChange={onChange}
          required={field.required}
        />
      );
    }

    return <JsonEditor label={label} value={value} onChange={onChange} />;
  }

  if (type === 'object') {
    // Special handling for primary_color
    if (label === 'primary_color' && field.fields?.rgba?.type === 'rgba') {
      return (
        <ColorPicker
          label={label}
          value={value}
          onChange={onChange}
          required={field.required}
        />
      );
    }

    // Special handling for properties
    if (label === 'properties' && !field.fields) {
      return (
        <PropertiesEditor
          label={label}
          value={value}
          onChange={onChange}
          required={field.required}
        />
      );
    }

    return <JsonEditor label={label} value={value} onChange={onChange} />;
  }

  // Default fallback: string input
  const fallbackValue =
    typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  return (
    <FormField label={label} htmlFor={inputId} required={field.required}>
      <input
        id={inputId}
        className="input"
        type="text"
        value={fallbackValue}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </FormField>
  );
};
