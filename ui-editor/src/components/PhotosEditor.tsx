import React, { useEffect, useState } from 'react';

import { FormField } from '~/components/FormField';
import { useEnumOptions } from '~/hooks/useEnumOptions';
import { humanize } from '~/utils/format';

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

const PHOTO_TYPES = [
  'unspecified',
  'print',
  'package',
  'filament_colors_sample',
] as const;

export const PhotosEditor = ({
  label,
  value,
  onChange,
  required,
}: PhotosEditorProps) => {
  const { options, loading } = useEnumOptions('material_photo_types', 'slug');
  const photos: PhotoItem[] = Array.isArray(value) ? value : [];
  const [localPhotos, setLocalPhotos] = useState<PhotoItem[]>(photos);

  useEffect(() => {
    setLocalPhotos(Array.isArray(value) ? value : []);
  }, [value]);

  const handleAdd = () => {
    const newPhoto: PhotoItem = {
      url: '',
      type: 'unspecified',
    };
    const updated = [...localPhotos, newPhoto];
    setLocalPhotos(updated);
    onChange(updated.length > 0 ? updated : null);
  };

  const handleRemove = (index: number) => {
    const updated = localPhotos.filter((_, i) => i !== index);
    setLocalPhotos(updated);
    onChange(updated.length > 0 ? updated : null);
  };

  const handleUpdate = (
    index: number,
    field: keyof PhotoItem,
    newValue: string,
  ) => {
    const updated = [...localPhotos];
    updated[index] = { ...updated[index], [field]: newValue };
    setLocalPhotos(updated);
    onChange(updated.length > 0 ? updated : null);
  };

  return (
    <FormField label={label} required={required}>
      <div className="space-y-4">
        {localPhotos.length > 0 ? (
          <div className="space-y-4">
            {localPhotos.map((photo, index) => (
              <div
                key={index}
                className="rounded-md border border-gray-200 bg-white p-4"
              >
                <div className="space-y-3">
                  {/* Preview */}
                  {photo.url ? (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Preview
                      </label>
                      <div className="h-32 w-32 overflow-hidden rounded border border-gray-200 bg-gray-50">
                        <img
                          src={photo.url}
                          alt={`Photo ${index + 1}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              'none';
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Preview
                      </label>
                      <div className="flex h-32 w-32 items-center justify-center rounded border border-gray-200 bg-gray-50 text-xs text-gray-400">
                        No image
                      </div>
                    </div>
                  )}

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
                        onChange={(e) =>
                          handleUpdate(index, 'url', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Type *
                      </label>
                      <select
                        className="select"
                        value={photo.type}
                        onChange={(e) =>
                          handleUpdate(index, 'type', e.target.value)
                        }
                        disabled={loading}
                      >
                        {options.length > 0
                          ? options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))
                          : PHOTO_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {humanize(type)}
                              </option>
                            ))}
                      </select>
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="btn-secondary w-full text-red-600 hover:text-red-800"
                    aria-label="Remove photo"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
            No photos added yet
          </div>
        )}

        <button type="button" onClick={handleAdd} className="btn-secondary">
          Add Photo
        </button>
      </div>
    </FormField>
  );
};
