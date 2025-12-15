import type { Material } from '../types';

interface PhotosReadSectionProps {
  material?: Material;
}

export const PhotosReadSection = ({ material }: PhotosReadSectionProps) => {
  if (!material?.photos || material.photos.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <div className="card-header">Photos</div>
      <div className="card-body">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {material.photos.map((photo, i: number) => {
            const photoUrl =
              typeof photo === 'string' ? photo : photo.url || '';
            const photoCaption =
              typeof photo === 'string' ? '' : photo.caption || '';
            return (
              <div
                key={i}
                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
              >
                <img
                  src={photoUrl}
                  alt={photoCaption || `Photo ${i + 1}`}
                  className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                />
                {photoCaption && (
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-2">
                    <p className="text-xs text-white">{photoCaption}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
