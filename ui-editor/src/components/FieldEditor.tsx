import React, { useMemo } from 'react';

import { useEnumOptions } from '~/hooks/useEnumOptions';
import {
  enumValueFieldForTable,
  resolveEnumSource,
  useLookupRelation,
} from '~/hooks/useSchema';

import { ColorArrayPicker, ColorPicker, JsonEditor } from './field-editors';
import type { SchemaField } from './field-types';
import { FormField } from './FormField';
import { MultiSelect } from './MultiSelect';
import { PhotosEditor } from './PhotosEditor';
import { PropertiesEditor } from './PropertiesEditor';

const extractValue = (val: unknown, valueField: string): string => {
  if (typeof val === 'object' && val !== null) {
    return String(
      (val as any)[valueField] ??
        (val as any).slug ??
        (val as any).key ??
        (val as any).id ??
        '',
    );
  }
  return String(val ?? '');
};

export const FieldEditor = ({
  label,
  field,
  value,
  onChange,
  disabled = false,
  entity = 'brand',
}: {
  label: string;
  field: SchemaField;
  value: unknown;
  onChange: (val: unknown) => void;
  disabled?: boolean;
  entity?: string;
}) => {
  const inputId = useMemo(() => `f_${label.replace(/\s+/g, '_')}`, [label]);
  const type = field.type;

  const relation = useLookupRelation(entity, field, label);
  const relOptions = useEnumOptions(
    relation?.table ?? null,
    relation?.valueField ?? null,
  );

  const arelation = useLookupRelation(entity, field.items, label);
  const aopts = useEnumOptions(
    arelation?.table ?? null,
    arelation?.valueField ?? null,
  );

  const enumSource = resolveEnumSource(field, label);
  const enumValueField = enumValueFieldForTable(enumSource.table);
  const enumOptions = useEnumOptions(enumSource.table, enumValueField);

  // Helper for common wrapper
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <FormField label={label} htmlFor={inputId} required={!!field.required}>
      {children}
    </FormField>
  );

  // Single-value foreign key → dropdown
  if (relation?.isLookup && relation.table && type !== 'array') {
    const stringValue = extractValue(value, relation.valueField || 'slug');
    return (
      <Wrapper>
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
        {relOptions.error && (
          <div className="mt-1 text-[11px] text-amber-700">
            Failed to load options.
          </div>
        )}
      </Wrapper>
    );
  }

  // Array of foreign keys → multi-select
  if (type === 'array' && arelation?.isLookup && arelation.table) {
    const arr: string[] = Array.isArray(value)
      ? value.map((v) => extractValue(v, arelation.valueField || 'id'))
      : [];

    if (aopts.error) {
      return (
        <Wrapper>
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
        </Wrapper>
      );
    }

    return (
      <Wrapper>
        <MultiSelect
          id={inputId}
          options={aopts.options}
          value={arr}
          onChange={onChange}
          disabled={disabled || aopts.loading}
          placeholder={aopts.loading ? 'Loading…' : 'Select items...'}
          searchPlaceholder="Search..."
        />
      </Wrapper>
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
    return (
      <FormField
        label={isDisabled ? `${label} (read-only)` : label}
        htmlFor={inputId}
        required={!!field.required}
      >
        <input
          id={inputId}
          className={`input ${isDisabled ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''}`}
          type="text"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          title={isDisabled ? 'This field is not editable' : undefined}
        />
      </FormField>
    );
  }

  if (type === 'integer' || type === 'number') {
    const numberValue = typeof value === 'number' ? value : '';
    return (
      <Wrapper>
        <input
          id={inputId}
          className="input"
          type="number"
          value={numberValue}
          disabled={disabled}
          onChange={(e) => {
            if (e.target.value === '') {
              onChange(null);
            } else {
              const val =
                type === 'integer'
                  ? parseInt(e.target.value, 10)
                  : parseFloat(e.target.value);
              onChange(isNaN(val) ? null : val);
            }
          }}
        />
      </Wrapper>
    );
  }

  if (type === 'boolean') {
    return (
      <Wrapper>
        <input
          id={inputId}
          type="checkbox"
          className="checkbox"
          checked={!!value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
      </Wrapper>
    );
  }

  if (enumSource.isEnum) {
    const inlineValues = enumSource.enumValues ?? [];
    const options =
      enumOptions.options.length > 0
        ? enumOptions.options
        : inlineValues.map((v) => ({ value: String(v), label: String(v) }));

    if (enumSource.isArray) {
      const arr: string[] = Array.isArray(value)
        ? value.map((v: any) => String(v))
        : [];

      return (
        <Wrapper>
          {enumSource.table && enumOptions.error && (
            <div className="mt-1 text-[11px] text-amber-700">
              Failed to load options; showing inline values if available.
            </div>
          )}
          <MultiSelect
            id={inputId}
            options={options}
            value={arr}
            onChange={onChange}
            disabled={
              disabled || (enumSource.table ? enumOptions.loading : false)
            }
            placeholder={
              enumSource.table && enumOptions.loading
                ? 'Loading…'
                : 'Select items...'
            }
            searchPlaceholder="Search..."
          />
        </Wrapper>
      );
    }

    const enumValue =
      typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : '';
    return (
      <Wrapper>
        <select
          id={inputId}
          className="select"
          value={enumValue}
          disabled={
            disabled || (enumSource.table ? enumOptions.loading : false)
          }
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            {enumSource.table && enumOptions.loading ? 'Loading…' : 'Select…'}
          </option>
          {options.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>
        {enumSource.table && enumOptions.error && (
          <div className="mt-1 text-[11px] text-amber-700">
            Failed to load options; using inline values if present.
          </div>
        )}
      </Wrapper>
    );
  }

  if (type === 'array') {
    const itemType = field.items?.type;
    const isPrimitiveItem =
      !itemType || ['string', 'slug', 'uuid'].includes(itemType as string);

    // If it's a primitive array but NOT a lookup and NOT an enum, use comma separated input
    if (isPrimitiveItem && !arelation?.isLookup && !field.items?.enum) {
      const arr: string[] = Array.isArray(value) ? value : [];
      return (
        <Wrapper>
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
        </Wrapper>
      );
    }

    // Special handling for secondary_colors
    if (
      label === 'secondary_colors' &&
      field.items?.type === 'object' &&
      (field.items?.properties?.color_rgba || field.items?.fields?.rgba)
    ) {
      return (
        <ColorArrayPicker
          label={label}
          value={value}
          onChange={onChange}
          required={!!field.required}
        />
      );
    }

    // Special handling for photos
    if (
      label === 'photos' &&
      field.items?.type === 'object' &&
      (field.items?.properties?.url ||
        field.items?.fields?.url?.type === 'url') &&
      (field.items?.properties?.type ||
        field.items?.fields?.type?.type === 'enum')
    ) {
      return (
        <PhotosEditor
          label={label}
          value={value}
          onChange={onChange}
          required={!!field.required}
        />
      );
    }

    return <JsonEditor label={label} value={value} onChange={onChange} />;
  }

  if (type === 'object') {
    // Special handling for primary_color
    if (
      label === 'primary_color' &&
      (field.properties?.color_rgba || field.fields?.rgba)
    ) {
      return (
        <ColorPicker
          label={label}
          value={value}
          onChange={onChange}
          required={!!field.required}
        />
      );
    }

    // Special handling for properties
    if (label === 'properties' && !field.properties && !field.fields) {
      return (
        <PropertiesEditor
          label={label}
          value={value}
          onChange={onChange}
          required={!!field.required}
        />
      );
    }

    return <JsonEditor label={label} value={value} onChange={onChange} />;
  }

  // Default fallback: string input
  const fallbackValue =
    typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  return (
    <FormField label={label} htmlFor={inputId} required={!!field.required}>
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
