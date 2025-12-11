import React from 'react';

import { humanize } from '~/utils/format';

export interface PhotoItem {
  url: string;
  type?: string;
}

export const PhotosGallery = ({
  photos,
  title = 'Photos',
}: {
  photos?: PhotoItem[] | null;
  title?: string;
}) => {
  if (!photos || photos.length === 0) return null;

  return (
    <div className="card">
      <div className="card-header">{title}</div>
      <div className="card-body">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((p, idx) => (
            <div key={idx} className="group">
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <div className="aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                  <img
                    src={p.url}
                    alt={humanize(p.type ?? '') || 'Material photo'}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              </a>
              <div className="mt-1 flex items-center justify-between">
                <div
                  className="truncate text-xs text-gray-700"
                  title={p.type || ''}
                >
                  {humanize(p.type ?? '') || 'Photo'}
                </div>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-orange-600 hover:text-orange-800"
                >
                  Open
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
