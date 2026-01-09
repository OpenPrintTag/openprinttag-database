import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';

import { Badge } from '~/components/ui';
import { ColorSwatch } from '~/components/ui/color-swatch';
import { useEnum } from '~/hooks/useEnum';
import {
  bestLabelFromItem,
  DATA_ENUM_TABLES,
  resolveEnumSource,
  useLookupRelation,
} from '~/hooks/useSchema';
import { extractEnumLabel, extractEnumValue } from '~/hooks/useSchemaMetadata';
import { extractColorHex } from '~/utils/color';
import { isPrimitive, isValidUrl, safeStringify } from '~/utils/format';

import type { SchemaField } from './field-types';

// Badge style constants
const BADGE_STYLES = {
  certification: 'bg-green-100 text-green-800 hover:bg-green-200',
  tag: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
} as const;

const getBadgeStyleForTable = (table: string): string => {
  if (table === 'material_certifications') return BADGE_STYLES.certification;
  if (table === 'material_tags') return BADGE_STYLES.tag;
  return '';
};

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
  // Load countries enum for resolving country codes to names
  const { data: countriesData } = useEnum('countries');
  const countriesMap = useMemo(() => {
    if (!countriesData?.items) return new Map<string, string>();
    return new Map(
      countriesData.items.map((item) => [
        extractEnumValue(item, 'countries', undefined),
        extractEnumLabel(item, 'countries', undefined),
      ]),
    );
  }, [countriesData]);

  const relation = useLookupRelation(entity, field, label);
  const arrayRelation = useLookupRelation(entity, field?.items, label);
  const enumSource = resolveEnumSource(field, label);

  if (value === undefined || value === null) {
    return <span className="text-gray-400">—</span>;
  }

  const renderColorSwatches = (colors: string[]) => (
    <div className="flex flex-wrap items-center gap-2">
      {colors.map((c, i) => (
        <ColorSwatch key={i} rgbaHex={c} label={c} title={c} />
      ))}
    </div>
  );

  const renderLookupLink = (table: string, val: unknown) => {
    const textLabel =
      typeof val === 'object'
        ? extractEnumLabel(val as Record<string, unknown>, table, undefined)
        : String(val);
    const key =
      typeof val === 'object'
        ? extractEnumValue(val as Record<string, unknown>, table, undefined)
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
            label={rgba}
            title={String(name ?? key)}
          />
        );
      }
    }

    // Special handling for countries - resolve key to name
    if (table === 'countries') {
      const countryName = countriesMap.get(String(key)) || textLabel;
      return <Badge key={String(key)}>{countryName}</Badge>;
    }

    // If it's a known lookup table, we link to the enum editor
    // Use imported DATA_ENUM_TABLES instead of hardcoded list
    if (DATA_ENUM_TABLES.includes(table) && table !== 'countries') {
      return (
        <Link
          key={String(key)}
          to="/enum/$table"
          params={{ table }}
          className="no-underline"
        >
          <Badge className={getBadgeStyleForTable(table)}>{textLabel}</Badge>
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
    const badgeStyle = label?.toLowerCase().includes('cert')
      ? BADGE_STYLES.certification
      : BADGE_STYLES.tag;
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <Badge key={i} className={badgeStyle}>
              {String(v)}
            </Badge>
          ))}
        </div>
      );
    }
    return <Badge className={badgeStyle}>{String(value)}</Badge>;
  }

  if (relation?.isLookup && relation.table) {
    return renderLookupLink(relation.table, value);
  }

  if (field?.type === 'rgba' && typeof value === 'string') {
    return <ColorSwatch rgbaHex={value} label={value} />;
  }

  if (
    field?.type === 'object' &&
    (field?.properties?.color_rgba || field?.properties?.rgba) &&
    value &&
    typeof value === 'object'
  ) {
    const rgba = (value as any).color_rgba || (value as any).rgba;
    if (typeof rgba === 'string') {
      return <ColorSwatch rgbaHex={rgba} label={rgba} />;
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
    return renderColorSwatches(swatches);
  }

  // Handle simple arrays of primitives (like keywords)
  if (Array.isArray(value)) {
    const primitiveItems = value.filter(
      (v) => typeof v === 'string' || typeof v === 'number',
    );
    if (primitiveItems.length === value.length && value.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <Badge key={i}>{String(v)}</Badge>
          ))}
        </div>
      );
    }
    if (value.length === 0) {
      return <span className="text-gray-400">[]</span>;
    }
  }

  const isPlainObject =
    value && typeof value === 'object' && !Array.isArray(value);
  if (isPlainObject) {
    const hex = extractColorHex(value);
    if (hex) {
      return renderColorSwatches([hex]);
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
