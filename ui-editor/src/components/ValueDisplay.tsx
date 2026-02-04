import { Link, useMatch } from '@tanstack/react-router';

import { Badge, ColorSwatch } from '~/components/ui';
import type { EnumTable } from '~/hooks/useEnum';
import { useEnum } from '~/hooks/useEnum';
import { useLookupRelation } from '~/hooks/useSchema';
import { FIELD_RELATION_MAP } from '~/server/data/schema-metadata';
import { isPrimitive, isValidUrl } from '~/utils/format';

import type { SchemaField } from './fieldTypes';

const getDisplayUrl = (url: string): string => {
  if (url.startsWith('/tmp/assets/')) {
    const filename = url.split('/').pop();
    return `/api/assets/${filename}`;
  }
  return url;
};

const BADGE_STYLES = {
  certification: 'bg-green-100 text-green-800 hover:bg-green-200',
  tag: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
} as const;

export const getBadgeStyleForTable = (table: string | null): string => {
  if (table === 'material_certifications') return BADGE_STYLES.certification;
  if (table === 'material_tags') return BADGE_STYLES.tag;
  return '';
};

interface RelationMetadata {
  isLookup: boolean;
  table: string | null;
  valueField: string;
  labelField: string;
}

interface ValueDisplayProps {
  value: unknown;
  field?: SchemaField;
  entity?: string;
  label?: string;
}

interface ObjectValueProps {
  relation: RelationMetadata | null;
  value: unknown;
  items?: EnumTable | null;
}

const ObjectValue = ({ relation, value, items }: ObjectValueProps) => {
  let val = value;
  if (items?.items && items.items.length > 0 && relation) {
    const found = items.items.find((i) => i[relation.valueField] === value);
    if (found) {
      val = found[relation.labelField];
    }
  }

  return (
    <Badge className={getBadgeStyleForTable(relation?.table ?? null)}>
      {String(val)}
    </Badge>
  );
};

interface PrimitiveValueProps {
  field?: SchemaField;
  value: unknown;
}

const PrimitiveValue = ({ field, value }: PrimitiveValueProps) => {
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

  if ((field?.type === 'object' && value) || typeof value === 'object') {
    const obj = value as Record<string, any>;
    if (field?.title === 'MaterialColor') {
      const rgba = obj.color_rgba || obj.rgba;
      if (typeof rgba === 'string') {
        return <ColorSwatch rgbaHex={rgba} label={rgba} />;
      }
    }

    if (field?.title === 'MaterialPhoto') {
      const photoUrl = getDisplayUrl(String(obj.url));

      return (
        <div className="flex flex-col gap-1">
          <div className="relative aspect-square w-28 overflow-hidden rounded border border-gray-200 bg-gray-50 shadow-sm transition-shadow hover:shadow-md">
            <a
              href={photoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full w-full"
            >
              <img
                src={photoUrl}
                alt={String(obj.type ?? 'photo')}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://placehold.co/400x400?text=Error';
                }}
              />
            </a>
          </div>
          {obj.type && (
            <div
              className="w-28 truncate text-center text-[10px] font-medium tracking-tight text-gray-500 uppercase"
              title={String(obj.type)}
            >
              {String(obj.type)}
            </div>
          )}
        </div>
      );
    }

    if (field?.title === 'BrandLinkPattern') {
      return (
        <div className="flex basis-1 flex-row items-center gap-2">
          {obj.type && (
            <div
              className="truncate text-center align-middle text-[10px] font-medium tracking-tight text-gray-500 uppercase"
              title={String(obj.type)}
            >
              {String(obj.type)}
            </div>
          )}
          <pre>{obj.pattern}</pre>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap justify-between gap-y-2 align-top">
        {Object.entries(obj).map(([key, val]) => (
          <div className="flex-1/2" key={key}>
            <dt className="mb-1 text-xs tracking-wide text-gray-500 uppercase">
              {key}
            </dt>
            <dd>{String(val)}</dd>
          </div>
        ))}
      </div>
    );
  }

  if (isPrimitive(value)) return <span>{String(value)}</span>;
};

export const ValueDisplay = ({
  value,
  field,
  entity = 'brand',
  label,
}: ValueDisplayProps) => {
  const match = useMatch({ from: '/brands/$brandId', shouldThrow: false });
  const relData = useLookupRelation(entity, field, label);
  const relItems = useEnum(relData?.table ?? null, {
    brandId: match?.params?.brandId,
  });
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-400">—</span>;
  }

  if (Array.isArray(value) && value.length === 0) {
    return <span className="text-gray-400">—</span>;
  }

  if (relItems.data && relData) {
    const entityRoute = field?.entity && FIELD_RELATION_MAP[field.entity];
    if (entityRoute && !field?.items) {
      const items = Array.isArray(relItems.data)
        ? relItems.data
        : (relItems.data as EnumTable).items;
      const val = items.find(
        (v: any) =>
          v[relData.valueField] === (value as any)?.[relData.valueField],
      );
      const params =
        field?.entity === 'container'
          ? { ...match?.params, containerId: val?.[relData.valueField] }
          : {};

      return (
        <Link
          to={entityRoute.route as any}
          params={params as any}
          className="no-underline"
        >
          <Badge>{val?.[relData.labelField]}</Badge>
        </Link>
      );
    }

    if (field?.type === 'array' && Array.isArray(value)) {
      return (
        <div className="flex gap-2">
          {value.map((v) => (
            <ObjectValue
              value={v}
              items={relItems.data as EnumTable}
              relation={relData}
              key={v}
            />
          ))}
        </div>
      );
    }

    return (
      <ObjectValue
        value={value}
        relation={relData}
        items={relItems.data as EnumTable}
      />
    );
  }

  if (
    field?.type === 'array' &&
    Array.isArray(value) &&
    field.items &&
    field.items.type === 'string'
  ) {
    return (
      <div className="flex flex-row flex-wrap gap-2">
        {value.map((v, i) => (
          <Badge variant="secondary" key={i}>
            {v}
          </Badge>
        ))}
      </div>
    );
  }

  if (field?.type === 'array' && Array.isArray(value)) {
    return (
      <div className="flex flex-row flex-wrap gap-2">
        {value.map((v, i) => (
          <PrimitiveValue field={field.items} key={i} value={v} />
        ))}
      </div>
    );
  }

  return <PrimitiveValue field={field} value={value} />;
};
