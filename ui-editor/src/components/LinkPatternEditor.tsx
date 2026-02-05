import React from 'react';

import { ArrayFieldEditor } from '~/components/ArrayFieldEditor';
import { LinkPattern, LinkPatternType } from '~/components/brand-sheet/types';
import { useFieldOptions } from '~/hooks/useFieldOptions';

interface LinkPatternEditorProps {
  label: string;
  value: unknown;
  onChange: (val: LinkPattern[] | undefined) => void;
  required?: boolean;
}

export const LinkPatternEditor = ({
  label,
  value,
  onChange,
  required,
}: LinkPatternEditorProps) => {
  const { options, loading } = useFieldOptions('brand_link_pattern_types');

  return (
    <ArrayFieldEditor<LinkPattern>
      label={label}
      value={value}
      onChange={onChange}
      required={required}
      emptyMessage="No link patterns added yet"
      addButtonLabel="Add Link Pattern"
      defaultItem={{ type: 'brand', pattern: '' }}
      renderItem={(pattern, index, updateItem) => (
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
                  updateItem('type', e.target.value as LinkPatternType)
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
                onChange={(e) => updateItem('pattern', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    />
  );
};
