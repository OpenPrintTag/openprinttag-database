import { useMutation } from '@tanstack/react-query';
import React, { useRef, useState } from 'react';

import { ArrayFieldEditor } from '~/components/ArrayFieldEditor';
import type { SelectOption } from '~/components/fieldTypes';
import { useFieldOptions } from '~/hooks/useFieldOptions';
import { getLocalAssetUrl, isLocalAsset } from '~/utils/format';

interface PhotoItem {
  url: string;
  type: string;
}

interface PhotosEditorProps {
  label: string;
  value: unknown;
  onChange: (val: PhotoItem[] | undefined) => void;
  required?: boolean;
  brandSlug?: string;
  materialSlug?: string;
}

interface UploadParams {
  file: File;
  brandSlug: string;
  materialSlug: string;
}

const useUploadImage = () => {
  return useMutation({
    mutationFn: async ({
      file,
      brandSlug,
      materialSlug,
    }: UploadParams): Promise<{ path: string }> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('brandSlug', brandSlug);
      formData.append('materialSlug', materialSlug);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Upload failed: ${res.status}`);
      }

      return { path: data.path };
    },
  });
};

const deleteLocalAsset = async (url: string): Promise<void> => {
  if (!isLocalAsset(url)) return;

  const suffix = url.replace('/tmp/assets/', '');
  if (!suffix) return;

  try {
    await fetch(`/api/assets/${suffix}`, { method: 'DELETE' });
  } catch (err) {
    console.error('Failed to delete local asset:', err);
  }
};

export const PhotosEditor = ({
  label,
  value,
  onChange,
  required,
  brandSlug,
  materialSlug,
}: PhotosEditorProps) => {
  const { options, loading } = useFieldOptions('photo_type');

  const handleBeforeRemove = async (photo: PhotoItem) => {
    await deleteLocalAsset(photo.url);
  };

  return (
    <ArrayFieldEditor<PhotoItem>
      label={label}
      value={value}
      onChange={onChange}
      required={required}
      emptyMessage="No photos added yet"
      addButtonLabel="Add Photo"
      defaultItem={{ url: '', type: 'unspecified' }}
      onBeforeRemove={handleBeforeRemove}
      renderItem={(photo, index, updateItem) => (
        <PhotoItemEditor
          photo={photo}
          index={index}
          updateItem={updateItem}
          options={options}
          loading={loading}
          brandSlug={brandSlug}
          materialSlug={materialSlug}
        />
      )}
    />
  );
};

interface PhotoItemEditorProps {
  photo: PhotoItem;
  index: number;
  updateItem: (field: keyof PhotoItem, value: string) => void;
  options: SelectOption[];
  loading: boolean;
  brandSlug?: string;
  materialSlug?: string;
}

const PhotoItemEditor = ({
  photo,
  index,
  updateItem,
  options,
  loading,
  brandSlug,
  materialSlug,
}: PhotoItemEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadMutation = useUploadImage();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadMutation.mutateAsync({
        file,
        brandSlug: brandSlug || 'unknown-brand',
        materialSlug: materialSlug || 'unknown-material',
      });
      updateItem('url', result.path);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const photoIsLocal = isLocalAsset(photo.url);
  const previewUrl = photo.url ? getLocalAssetUrl(photo.url) : '';

  let uploadLabel = 'Upload';
  if (isUploading) uploadLabel = 'Uploading...';
  else if (photo.url) uploadLabel = 'Replace';

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Preview
        </label>
        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50 text-xs text-gray-400">
          {photo.url ? (
            <img
              src={previewUrl}
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
        {photoIsLocal && (
          <span className="mt-1 inline-block rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
            Local file (will be included in MR)
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            URL *
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              className="input flex-1"
              placeholder="https://example.com/image.png"
              value={photo.url}
              onChange={(e) => updateItem('url', e.target.value)}
            />
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={isUploading}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadLabel}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          {uploadError && (
            <p className="mt-1 text-xs text-red-600">{uploadError}</p>
          )}
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
                <option key={String(opt.value)} value={String(opt.value ?? '')}>
                  {opt.label}
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
};
