import React, { useCallback, useEffect, useState } from 'react';

import { FormField } from '~/components/FormField';

interface PropertiesEditorProps {
  label: string;
  value: unknown;
  onChange: (val: Record<string, PropertyValue> | null) => void;
  required?: boolean;
}

type PropertyValue = string | number | boolean | null;

type PropertyEntry = {
  key: string;
  value: PropertyValue;
  valueType: string;
};

const detectValueType = (val: PropertyValue): string => {
  if (typeof val === 'number') return 'number';
  if (typeof val === 'boolean') return 'boolean';
  if (val === null) return 'null';
  return 'string';
};

const convertValue = (
  currentValue: PropertyValue,
  targetType: string,
): PropertyValue => {
  if (targetType === 'number') {
    const num = Number(currentValue);
    return isNaN(num) ? 0 : num;
  }
  if (targetType === 'boolean') {
    if (typeof currentValue === 'boolean') return currentValue;
    if (typeof currentValue === 'string') {
      return currentValue.toLowerCase() === 'true';
    }
    return false;
  }
  if (targetType === 'null') {
    return null;
  }
  return String(currentValue ?? '');
};

export const PropertiesEditor = ({
  label,
  value,
  onChange,
  required,
}: PropertiesEditorProps) => {
  const properties: Record<string, PropertyValue> =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, PropertyValue>)
      : {};

  const [localProperties, setLocalProperties] = useState<PropertyEntry[]>([]);

  useEffect(() => {
    const entries = Object.entries(properties);
    setLocalProperties(
      entries.map(([key, val]) => ({
        key,
        value: val,
        valueType: detectValueType(val),
      })),
    );
  }, [value]);

  const updateProperties = useCallback(
    (entries: PropertyEntry[]) => {
      const props: Record<string, PropertyValue> = {};
      entries.forEach((entry) => {
        if (entry.key.trim()) {
          props[entry.key.trim()] = convertValue(entry.value, entry.valueType);
        }
      });
      onChange(Object.keys(props).length > 0 ? props : null);
    },
    [onChange],
  );

  const handleAdd = () => {
    const newEntry = { key: '', value: '', valueType: 'string' };
    setLocalProperties([...localProperties, newEntry]);
  };

  const handleRemove = (index: number) => {
    const updated = localProperties.filter((_, i) => i !== index);
    setLocalProperties(updated);
    updateProperties(updated);
  };

  const handleUpdate = (
    index: number,
    field: 'key' | 'value' | 'valueType',
    newValue: string | PropertyValue,
  ) => {
    const updated = [...localProperties];
    if (field === 'valueType') {
      updated[index] = {
        ...updated[index],
        valueType: newValue as string,
        value: convertValue(updated[index].value, newValue as string),
      };
    } else if (field === 'key') {
      updated[index] = { ...updated[index], key: newValue as string };
    } else {
      updated[index] = { ...updated[index], value: newValue as PropertyValue };
    }
    setLocalProperties(updated);
    updateProperties(updated);
  };

  const renderValueInput = (
    index: number,
    value: PropertyValue,
    valueType: string,
  ) => {
    if (valueType === 'boolean') {
      return (
        <select
          className="select"
          value={String(value)}
          onChange={(e) =>
            handleUpdate(index, 'value', e.target.value === 'true')
          }
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }
    if (valueType === 'null') {
      return (
        <input type="text" className="input" value="null" disabled readOnly />
      );
    }
    if (valueType === 'number') {
      return (
        <input
          type="number"
          step="any"
          className="input"
          value={value === null ? '' : String(value)}
          onChange={(e) => {
            const num = e.target.value === '' ? 0 : Number(e.target.value);
            handleUpdate(index, 'value', isNaN(num) ? 0 : num);
          }}
        />
      );
    }
    return (
      <input
        type="text"
        className="input"
        value={value === null ? '' : String(value)}
        onChange={(e) => handleUpdate(index, 'value', e.target.value)}
      />
    );
  };

  return (
    <FormField label={label} required={required}>
      <div className="space-y-4">
        {localProperties.length > 0 ? (
          <div className="space-y-3">
            {localProperties.map((entry, index) => (
              <div
                key={index}
                className="rounded-md border border-gray-200 bg-white p-3"
              >
                <div className="space-y-3">
                  {/* Key */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Key
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="property_name"
                      value={entry.key}
                      onChange={(e) =>
                        handleUpdate(index, 'key', e.target.value)
                      }
                    />
                  </div>

                  {/* Value Type */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      className="select"
                      value={entry.valueType}
                      onChange={(e) =>
                        handleUpdate(index, 'valueType', e.target.value)
                      }
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="null">Null</option>
                    </select>
                  </div>

                  {/* Value */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Value
                    </label>
                    {renderValueInput(index, entry.value, entry.valueType)}
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="btn-secondary w-full text-red-600 hover:text-red-800"
                    aria-label="Remove property"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
            No properties added yet
          </div>
        )}

        <button type="button" onClick={handleAdd} className="btn-secondary">
          Add Property
        </button>
      </div>
    </FormField>
  );
};
