import React from 'react';

import { ArrayFieldEditor } from '~/components/ArrayFieldEditor';
import { useFieldOptions } from '~/hooks/useFieldOptions';

interface PhotoItem {
  url: string;
  type: string;
}

interface PhotosEditorProps {
  label: string;
  value: unknown;
  onChange: (val: PhotoItem[] | null) => void;
  required?: boolean;
}

export const PhotosEditor = ({
  label,
  value,
  onChange,
  required,
}: PhotosEditorProps) => {
  const { options, loading } = useFieldOptions('photo_type');

  return (
    <ArrayFieldEditor<PhotoItem>
      label={label}
      value={value}
      onChange={onChange}
      required={required}
      emptyMessage="No photos added yet"
      addButtonLabel="Add Photo"
      defaultItem={{ url: '', type: 'unspecified' }}
      renderItem={(photo, index, updateItem) => (
        <div className="space-y-3">
          {/* Preview */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Preview
            </label>
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50 text-xs text-gray-400">
              {photo.url ? (
                <img
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                'No image'
              )}
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                URL *
              </label>
              <input
                type="url"
                className="input"
                placeholder="https://example.com/image.png"
                value={photo.url}
                onChange={(e) => updateItem('url', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Type *
              </label>
              <select
                className="select"
                value={photo.type}
                onChange={(e) => updateItem('type', e.target.value)}
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
          </div>
        </div>
      )}
    />
  );
};
