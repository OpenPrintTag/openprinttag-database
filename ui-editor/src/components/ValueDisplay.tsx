import { Link } from '@tanstack/react-router';

import { Badge } from '~/components/ui';
import { ColorSwatch } from '~/components/ui/color-swatch';
import {
  bestLabelFromItem,
  resolveEnumSource,
  useLookupRelation,
} from '~/hooks/useSchema';
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
  entity?: string;
  label?: string;
}

export const ValueDisplay = ({
  value,
  field,
  colors,
  entity = 'brand',
  label,
}: ValueDisplayProps) => {
  if (value === undefined || value === null) {
    return <span className="text-gray-400">—</span>;
  }

  const relation = useLookupRelation(entity, field, label);
  const arrayRelation = useLookupRelation(entity, field?.items, label);
  const enumSource = resolveEnumSource(field, label);

  const renderLookupLink = (table: string, val: unknown) => {
    const textLabel =
      typeof val === 'object' ? bestLabelFromItem(val) : String(val);
    const key =
      typeof val === 'object'
        ? (val as any).slug || (val as any).key || textLabel
        : textLabel;

    // Special handling for colors if we have them
    if (table === 'colors') {
      const item = colors?.[String(key)];
      const rgba =
        item && typeof item === 'object' && 'rgba' in item ? item.rgba : null;
      if (rgba && typeof rgba === 'string') {
        const name =
          item && typeof item === 'object' && 'name' in item ? item.name : null;
        return (
          <ColorSwatch
            rgbaHex={rgba}
            label={hexToRgbText(rgba)}
            title={String(name ?? key)}
          />
        );
      }
    }

    // If it's a known lookup table, we link to the enum editor
    const ENUM_TABLES = [
      'material_certifications',
      'material_tags',
      'material_types',
      'material_tag_categories',
      'material_photo_types',
      'brand_link_pattern_types',
      'countries',
    ];

    if (ENUM_TABLES.includes(table) && table !== 'countries') {
      let badgeClass = '';
      if (table === 'material_certifications') {
        badgeClass = 'bg-green-100 text-green-800 hover:bg-green-200';
      } else if (table === 'material_tags') {
        badgeClass = 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      }

      return (
        <Link
          key={String(key)}
          to="/enum/$table"
          params={{ table }}
          className="no-underline"
        >
          <Badge className={badgeClass}>{textLabel}</Badge>
        </Link>
      );
    }

    return <Badge key={String(key)}>{textLabel}</Badge>;
  };

  if (field?.type === 'array' && Array.isArray(value)) {
    if (arrayRelation?.isLookup && arrayRelation.table) {
      if (value.length === 0) return <span className="text-gray-400">[]</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <span key={i}>{renderLookupLink(arrayRelation.table!, v)}</span>
          ))}
        </div>
      );
    }

    if (enumSource.isEnum && enumSource.isArray) {
      if (value.length === 0) return <span className="text-gray-400">[]</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => {
            const textLabel =
              typeof v === 'object' && v !== null
                ? bestLabelFromItem(v)
                : String(v);
            return <Badge key={i}>{textLabel}</Badge>;
          })}
        </div>
      );
    }
  }

  if (enumSource.isEnum && !enumSource.isArray) {
    const textLabel =
      typeof value === 'object' && value !== null
        ? bestLabelFromItem(value)
        : String(value);
    return <Badge>{textLabel}</Badge>;
  }

  if (
    label?.toLowerCase().includes('tag') ||
    label?.toLowerCase().includes('certification')
  ) {
    const isCertification = label?.toLowerCase().includes('cert');
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <Badge
              key={i}
              className={
                isCertification
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }
            >
              {String(v)}
            </Badge>
          ))}
        </div>
      );
    }
    return (
      <Badge
        className={
          isCertification
            ? 'bg-green-100 text-green-800 hover:bg-green-200'
            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        }
      >
        {String(value)}
      </Badge>
    );
  }

  if (relation?.isLookup && relation.table) {
    return renderLookupLink(relation.table, value);
  }

  if (field?.type === 'rgba' && typeof value === 'string') {
    return <ColorSwatch rgbaHex={value} label={hexToRgbText(value)} />;
  }

  if (
    field?.type === 'object' &&
    (field?.properties?.color_rgba || field?.properties?.rgba) &&
    value &&
    typeof value === 'object'
  ) {
    const rgba = (value as any).color_rgba || (value as any).rgba;
    if (typeof rgba === 'string') {
      return <ColorSwatch rgbaHex={rgba} label={hexToRgbText(rgba)} />;
    }
  }

  const looksLikePhotos =
    Array.isArray(value) &&
    (field?.type === 'array' || (!field && value.length > 0)) &&
    (field?.items?.type === 'object' || !field) &&
    (field?.items?.properties?.url ||
      (field?.items as any)?.fields?.url ||
      (value.length > 0 &&
        typeof value[0] === 'object' &&
        value[0] !== null &&
        'url' in (value[0] as object))) &&
    (value as any[]).every((p) => typeof p === 'object' && p !== null);

  if (looksLikePhotos) {
    const photos = (value as any[]).filter((p) => p && p.url);
    if (photos.length === 0) return <span className="text-gray-400">[]</span>;
    return (
      <div className="flex flex-wrap gap-3">
        {photos.map((p, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            <div className="relative aspect-square w-28 overflow-hidden rounded border border-gray-200 bg-gray-50 shadow-sm transition-shadow hover:shadow-md">
              <a
                href={String(p.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full w-full"
              >
                <img
                  src={String(p.url)}
                  alt={String(p.type ?? 'photo')}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://placehold.co/400x400?text=Error';
                  }}
                />
              </a>
            </div>
            {p.type && (
              <div
                className="w-28 truncate text-center text-[10px] font-medium tracking-tight text-gray-500 uppercase"
                title={String(p.type)}
              >
                {String(p.type)}
              </div>
            )}
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

  const swatches = Array.isArray(value)
    ? (value.map(extractColorHex).filter(Boolean) as string[])
    : [];
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
              <ValueDisplay value={v} colors={colors} />
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
