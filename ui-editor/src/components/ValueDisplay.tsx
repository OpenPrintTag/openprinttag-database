import { Badge } from '~/components/ui';
import { ColorSwatch } from '~/components/ui/color-swatch';
import { extractColorHex, hexToRgbText } from '~/utils/color';
import { isPrimitive, isValidUrl, safeStringify } from '~/utils/format';

import type { SchemaField } from './field-types';

type ColorItem = {
  rgba?: string;
  name?: string;
};

interface ValueDisplayProps {
  value: unknown;
  field?: SchemaField;
  colors?: Record<string, ColorItem> | null;
}

export const ValueDisplay = ({ value, field, colors }: ValueDisplayProps) => {
  if (value === undefined || value === null) {
    return <span className="text-gray-400">—</span>;
  }

  const singleColorsFk = field?.foreign_key?.entity === 'colors';
  const arrayColorsFk =
    field?.type === 'array' && field?.items?.foreign_key?.entity === 'colors';

  if (singleColorsFk && typeof value === 'string') {
    const item = colors?.[String(value)];
    const rgba =
      item && typeof item === 'object' && 'rgba' in item ? item.rgba : null;
    if (rgba && typeof rgba === 'string') {
      const name =
        item && typeof item === 'object' && 'name' in item ? item.name : null;
      return (
        <ColorSwatch
          rgbaHex={rgba}
          label={hexToRgbText(rgba)}
          title={String(name ?? value)}
        />
      );
    }
  }

  if (arrayColorsFk && Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((id, idx) => {
          const item = colors?.[String(id)];
          const key = `${String(id)}_${idx}`;
          const rgba =
            item && typeof item === 'object' && 'rgba' in item
              ? item.rgba
              : null;
          const name =
            item && typeof item === 'object' && 'name' in item
              ? item.name
              : null;
          if (rgba && typeof rgba === 'string') {
            return (
              <ColorSwatch
                key={key}
                rgbaHex={rgba}
                label={hexToRgbText(rgba)}
                title={String(name ?? id)}
              />
            );
          }
          return (
            <span key={key} className="text-xs text-gray-500">
              {String(id)}
            </span>
          );
        })}
      </div>
    );
  }

  if (field?.type === 'rgba' && typeof value === 'string') {
    return <ColorSwatch rgbaHex={value} label={hexToRgbText(value)} />;
  }

  if (
    field?.type === 'object' &&
    field?.fields?.rgba?.type === 'rgba' &&
    value &&
    typeof value === 'object' &&
    'rgba' in value
  ) {
    const rgba = (value as { rgba?: unknown }).rgba;
    if (typeof rgba === 'string') {
      return <ColorSwatch rgbaHex={rgba} label={hexToRgbText(rgba)} />;
    }
  }

  if (
    field?.type === 'array' &&
    field?.items?.type === 'object' &&
    field?.items?.fields?.rgba?.type === 'rgba' &&
    Array.isArray(value)
  ) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((it, idx) => {
          const hex = it?.rgba;
          if (typeof hex === 'string') {
            return (
              <ColorSwatch key={idx} rgbaHex={hex} label={hexToRgbText(hex)} />
            );
          }
          return (
            <span key={idx} className="text-xs text-gray-500">
              —
            </span>
          );
        })}
      </div>
    );
  }

  const looksLikePhotos =
    Array.isArray(value) &&
    field?.type === 'array' &&
    field?.items?.type === 'object' &&
    !!field?.items?.fields?.url;

  if (looksLikePhotos) {
    const photos = (value as any[]).filter((p) => p && p.url);
    if (photos.length === 0) return <span className="text-gray-400">[]</span>;
    return (
      <div className="flex flex-wrap gap-3">
        {photos.map((p, idx) => (
          <div key={idx} className="w-28">
            <div className="aspect-square w-28 overflow-hidden rounded border border-gray-200 bg-gray-50">
              <img
                src={String(p.url)}
                alt={String(p.type ?? 'photo')}
                className="h-full w-full object-cover"
              />
            </div>
            <div
              className="mt-1 truncate text-[11px] text-gray-600"
              title={String(p.type ?? 'photo')}
            >
              {String(p.type ?? 'photo')}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (field?.type === 'url' || isValidUrl(String(value))) {
    return (
      <a
        href={String(value)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-orange-600 underline hover:text-orange-800"
      >
        {String(value)}
      </a>
    );
  }

  if (isPrimitive(value)) return <span>{String(value)}</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-400">[]</span>;
    const allPrim = value.every(isPrimitive);
    if (allPrim) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <Badge key={i}>{String(v)}</Badge>
          ))}
        </div>
      );
    }
    const swatches = value.map(extractColorHex).filter(Boolean) as string[];
    if (swatches.length > 0) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          {swatches.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-md border ring-1 ring-gray-200"
                style={{ background: c as any }}
              />
              <code className="text-xs text-gray-700">{c}</code>
            </div>
          ))}
        </div>
      );
    }
    return (
      <pre className="max-h-56 overflow-auto rounded-md bg-gray-50 p-2 text-[11px] leading-4">
        {safeStringify(value)}
      </pre>
    );
  }

  const isPlainObject =
    value && typeof value === 'object' && !Array.isArray(value);
  if (isPlainObject) {
    const hex = extractColorHex(value);
    if (hex) {
      return (
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-md border ring-1 ring-gray-200"
            style={{ background: hex as any }}
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-gray-700">{hex}</div>
          </div>
        </div>
      );
    }

    const entries = Object.entries(value as Record<string, any>);
    if (entries.length === 0)
      return <span className="text-gray-400">{'{ }'}</span>;
    return (
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {entries.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-[11px] tracking-wide text-gray-500 uppercase">
              {k}
            </dt>
            <dd className="text-sm break-words text-gray-900">
              {isPrimitive(v) ? (
                String(v)
              ) : (
                <pre className="max-h-40 overflow-auto rounded bg-gray-50 p-2 text-[11px] leading-4">
                  {safeStringify(v)}
                </pre>
              )}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <pre className="max-h-56 overflow-auto rounded-md bg-gray-50 p-2 text-[11px] leading-4">
      {safeStringify(value)}
    </pre>
  );
};
