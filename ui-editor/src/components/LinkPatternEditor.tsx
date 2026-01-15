import React from 'react';

import { LinkPattern, LinkPatternType } from '~/components/brand-sheet/types';
import { FormField } from '~/components/FormField';
import { useEnumOptions } from '~/hooks/useEnumOptions';

interface LinkPatternEditorProps {
  label: string;
  value: unknown;
  onChange: (val: LinkPattern[] | null) => void;
  required?: boolean;
}

export const LinkPatternEditor = ({
  label,
  value,
  onChange,
  required,
}: LinkPatternEditorProps) => {
  const { options, loading } = useEnumOptions(
    'brand_link_pattern_types',
    'name',
  );
  const patterns: LinkPattern[] = Array.isArray(value) ? value : [];

  const updatePatterns = (updated: LinkPattern[]) => {
    onChange(updated.length > 0 ? updated : null);
  };

  const handleAdd = () => {
    updatePatterns([...patterns, { type: 'brand', pattern: '' }]);
  };

  const handleRemove = (index: number) => {
    updatePatterns(patterns.filter((_, i) => i !== index));
  };

  const handleUpdate = <K extends keyof LinkPattern>(
    index: number,
    field: K,
    newValue: LinkPattern[K],
  ) => {
    const updated = [...patterns];
    updated[index] = { ...updated[index], [field]: newValue };
    updatePatterns(updated);
  };

  return (
    <FormField label={label} required={required}>
      <div className="space-y-4">
        {patterns.length > 0 ? (
          <div className="space-y-4">
            {patterns.map((pattern, index) => (
              <div
                key={index}
                className="rounded-md border border-gray-200 bg-white p-4"
              >
                <div className="space-y-3">
                  {/* Fields */}
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Type *
                      </label>
                      <select
                        className="select"
                        value={pattern.type}
                        onChange={(e) =>
                          handleUpdate(
                            index,
                            'type',
                            e.target.value as LinkPatternType,
                          )
                        }
                        disabled={loading}
                      >
                        {options.length > 0 &&
                          options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Pattern *
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="https://example.com/{id}"
                        value={pattern.pattern}
                        onChange={(e) =>
                          handleUpdate(index, 'pattern', e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="btn-secondary w-full text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
            No link patterns added yet
          </div>
        )}

        <button type="button" onClick={handleAdd} className="btn-secondary">
          Add Link Pattern
        </button>
      </div>
    </FormField>
  );
};
