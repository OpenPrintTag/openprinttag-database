import React, { memo, useMemo } from 'react';

import { useFieldOptions } from '~/hooks/useFieldOptions';

import { ColorArrayPicker, ColorPicker, JsonEditor } from './field-editors';
import type { SchemaField, SelectOption } from './field-types';
import { FormField } from './FormField';
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
  entity?: string;
}

interface WrapperProps {
  label: string;
  inputId: string;
  required: boolean;
  children: React.ReactNode;
}

// Utility functions
/**
 * Extract value from an item using the specified field.
 * No guessing - uses explicit valueField from metadata.
 */
const extractValue = (val: unknown, valueField: string): string => {
  if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    return String(obj[valueField] ?? '');
  }
  return String(val ?? '');
};

const parseCommaSeparated = (input: string): string[] =>
  input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const toStringValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
};

// Wrapper component for consistent field layout
const FieldWrapper: React.FC<WrapperProps> = ({
  label,
  inputId,
  required,
  children,
}) => (
  <FormField label={label} htmlFor={inputId} required={required}>
    {children}
  </FormField>
);

// Error message component
const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="mt-1 text-[11px] text-amber-700">{message}</div>
);

// Comma-separated input fallback
const CommaSeparatedInput: React.FC<{
  id?: string;
  value: string[];
  onChange: (val: string[]) => void;
  disabled?: boolean;
  className?: string;
}> = ({ id, value, onChange, disabled, className = 'input' }) => {
  const [localValue, setLocalValue] = React.useState(() => value.join(', '));

  // Sync local value when external value changes (e.g., form reset)
  React.useEffect(() => {
    setLocalValue(value.join(', '));
  }, [value]);

  const handleBlur = () => {
    onChange(parseCommaSeparated(localValue));
  };

  return (
    <input
      id={id}
      className={className}
      type="text"
      placeholder="Comma separated"
      value={localValue}
      disabled={disabled}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
    />
  );
};

// Select dropdown component
const SelectDropdown: React.FC<{
  id: string;
  value: string;
  options: SelectOption[];
  onChange: (val: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
}> = ({
  id,
  value,
  options,
  onChange,
  disabled,
  loading,
  placeholder = 'Select…',
}) => (
  <select
    id={id}
    className="select"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
  >
    <option value="" disabled>
      {loading ? 'Loading…' : placeholder}
    </option>
    {options.map((opt) => (
      <option key={String(opt.value)} value={String(opt.value)}>
        {opt.label}
      </option>
    ))}
  </select>
);

// Field type handlers
const renderForeignKeySelect = (
  inputId: string,
  value: unknown,
  valueField: string,
  options: SelectOption[],
  loading: boolean,
  error: string | null,
  disabled: boolean,
  onChange: (val: unknown) => void,
): React.ReactNode => {
  const stringValue = extractValue(value, valueField);
  return (
    <>
      <SelectDropdown
        id={inputId}
        value={stringValue}
        options={options}
        onChange={(val) => onChange(val || null)}
        disabled={disabled || loading || !!error}
        loading={loading}
      />
      {error && <ErrorMessage message="Failed to load options." />}
    </>
  );
};

const renderMultiSelect = (
  inputId: string,
  value: unknown,
  valueField: string,
  options: SelectOption[],
  loading: boolean,
  error: string | null,
  disabled: boolean,
  onChange: (val: unknown) => void,
): React.ReactNode => {
  const arr: string[] = Array.isArray(value)
    ? value.map((v) => extractValue(v, valueField))
    : [];

  if (error) {
    return (
      <>
        <ErrorMessage message="Failed to load options; using comma separated fallback below." />
        <CommaSeparatedInput
          value={arr}
          onChange={onChange}
          className="input mt-2"
        />
      </>
    );
  }

  return (
    <MultiSelect
      id={inputId}
      options={options}
      value={arr}
      onChange={onChange}
      disabled={disabled || loading}
      placeholder={loading ? 'Loading…' : 'Select items...'}
      searchPlaceholder="Search..."
    />
  );
};

// Main component
export const FieldEditor: React.FC<FieldEditorProps> = memo(
  ({
    label,
    field,
    value,
    onChange,
    disabled = false,
    entity: _entity = 'brand',
  }) => {
    const inputId = useMemo(() => `f_${label.replace(/\s+/g, '_')}`, [label]);
    const type = field.type;
    const isRequired = !!field.required;

    // Unified field options hook - handles relations, enums, and inline values
    const fieldOptions = useFieldOptions(label, field);

    // Field with options (relation or enum) - single value
    if (fieldOptions.hasOptions && !fieldOptions.isArray && type !== 'array') {
      return (
        <FieldWrapper label={label} inputId={inputId} required={isRequired}>
          {renderForeignKeySelect(
            inputId,
            value,
            fieldOptions.valueField ?? 'name',
            fieldOptions.options,
            fieldOptions.loading,
            fieldOptions.error,
            disabled,
            onChange,
          )}
        </FieldWrapper>
      );
    }

    // Field with options (relation or enum) - array value
    if (fieldOptions.hasOptions && (fieldOptions.isArray || type === 'array')) {
      return (
        <FieldWrapper label={label} inputId={inputId} required={isRequired}>
          {renderMultiSelect(
            inputId,
            value,
            fieldOptions.valueField ?? 'name',
            fieldOptions.options,
            fieldOptions.loading,
            fieldOptions.error,
            disabled,
            onChange,
          )}
        </FieldWrapper>
      );
    }

    // String types (string, slug, uuid, rgba)
    if (
      type === 'string' ||
      type === 'slug' ||
      type === 'uuid' ||
      type === 'rgba'
    ) {
      const stringValue = typeof value === 'string' ? value : '';
      const isReadOnly = disabled || type === 'uuid';

      return (
        <FormField
          label={isReadOnly ? `${label} (read-only)` : label}
          htmlFor={inputId}
          required={isRequired}
        >
          <input
            id={inputId}
            className={`input ${isReadOnly ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''}`}
            type="text"
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            disabled={isReadOnly}
            title={isReadOnly ? 'This field is not editable' : undefined}
          />
        </FormField>
      );
    }

    // Number types (integer, number)
    if (type === 'integer' || type === 'number') {
      const numberValue = typeof value === 'number' ? value : '';
      return (
        <FieldWrapper label={label} inputId={inputId} required={isRequired}>
          <input
            id={inputId}
            className="input"
            type="number"
            value={numberValue}
            disabled={disabled}
            onChange={(e) => {
              if (e.target.value === '') {
                onChange(null);
                return;
              }
              const parsed =
                type === 'integer'
                  ? parseInt(e.target.value, 10)
                  : parseFloat(e.target.value);
              onChange(isNaN(parsed) ? null : parsed);
            }}
          />
        </FieldWrapper>
      );
    }

    // Boolean type
    if (type === 'boolean') {
      return (
        <FieldWrapper label={label} inputId={inputId} required={isRequired}>
          <input
            id={inputId}
            type="checkbox"
            className="checkbox"
            checked={!!value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
          />
        </FieldWrapper>
      );
    }

    // Array type
    if (type === 'array') {
      return renderArrayField(label, field, value, onChange, disabled, inputId);
    }

    // Object type
    if (type === 'object') {
      return renderObjectField(label, field, value, onChange);
    }

    // Default fallback: string input
    const fallbackValue = toStringValue(value);
    return (
      <FormField label={label} htmlFor={inputId} required={isRequired}>
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
  },
);

// Array field renderer
const renderArrayField = (
  label: string,
  field: SchemaField,
  value: unknown,
  onChange: (val: unknown) => void,
  disabled: boolean,
  inputId: string,
): React.ReactNode => {
  const itemType = field.items?.type;
  const isPrimitiveItem =
    !itemType || ['string', 'slug', 'uuid'].includes(itemType as string);

  // Primitive array without lookup or enum → comma separated input
  if (isPrimitiveItem && !field.items?.enum) {
    const arr: string[] = Array.isArray(value) ? value : [];
    return (
      <FormField label={label} htmlFor={inputId} required={!!field.required}>
        <CommaSeparatedInput
          id={inputId}
          value={arr}
          onChange={onChange}
          disabled={disabled}
        />
      </FormField>
    );
  }

  // Secondary colors array
  if (isSecondaryColorsField(label, field)) {
    return (
      <ColorArrayPicker
        label={label}
        value={value}
        onChange={onChange}
        required={!!field.required}
      />
    );
  }

  // Photos array
  if (isPhotosField(label, field)) {
    return (
      <PhotosEditor
        label={label}
        value={value}
        onChange={onChange}
        required={!!field.required}
      />
    );
  }

  // Fallback to JSON editor
  return <JsonEditor label={label} value={value} onChange={onChange} />;
};

// Object field renderer
const renderObjectField = (
  label: string,
  field: SchemaField,
  value: unknown,
  onChange: (val: unknown) => void,
): React.ReactNode => {
  // Primary color object
  if (isPrimaryColorField(label, field)) {
    return (
      <ColorPicker
        label={label}
        value={value}
        onChange={onChange}
        required={!!field.required}
      />
    );
  }

  // Properties object (dynamic key-value pairs)
  if (isPropertiesField(label, field)) {
    return (
      <PropertiesEditor
        label={label}
        value={value}
        onChange={onChange}
        required={!!field.required}
      />
    );
  }

  // Fallback to JSON editor
  return <JsonEditor label={label} value={value} onChange={onChange} />;
};

// Field type detection helpers
const isSecondaryColorsField = (label: string, field: SchemaField): boolean =>
  label === 'secondary_colors' &&
  field.items?.type === 'object' &&
  !!(field.items?.properties?.color_rgba || field.items?.fields?.rgba);

const isPhotosField = (label: string, field: SchemaField): boolean =>
  label === 'photos' &&
  field.items?.type === 'object' &&
  !!(
    field.items?.properties?.url || field.items?.fields?.url?.type === 'url'
  ) &&
  !!(
    field.items?.properties?.type || field.items?.fields?.type?.type === 'enum'
  );

const isPrimaryColorField = (label: string, field: SchemaField): boolean =>
  label === 'primary_color' &&
  !!(field.properties?.color_rgba || field.fields?.rgba);

const isPropertiesField = (label: string, field: SchemaField): boolean =>
  label === 'properties' && !field.properties && !field.fields;
