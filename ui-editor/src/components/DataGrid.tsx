import { Link } from '@tanstack/react-router';
import React from 'react';

import { Badge } from '~/components/ui';
import { useColorsLookup } from '~/context/ColorsLookupContext';
import { useLookupRelation } from '~/hooks/useSchema';

import type { SchemaField } from './field-types';
import { ValueDisplay } from './ValueDisplay';

export interface DataGridProps<T = Record<string, unknown>> {
  data: T;
  title?: string;
  /** Optional schema fields for enhanced rendering */
  fields?: Record<string, SchemaField>;
  /** Keys to show first; others follow in schema or alphabetical order */
  primaryKeys?: string[];
  /** Keys to hide */
  excludeKeys?: string[];
}

export const DataGrid = <
  T extends Record<string, unknown> = Record<string, unknown>,
>({
  data,
  title,
  fields,
  primaryKeys = [],
  excludeKeys = [],
}: DataGridProps<T>) => {
  const colors = useColorsLookup();

  // Determine keys to show
  const allKeys = fields
    ? Object.keys(fields)
    : Object.keys(data ?? {}).filter((k) => !excludeKeys.includes(k));

  // Sort: primary keys first, then rest in order (schema order if fields present, else alphabetical)
  const sortedKeys = [
    ...primaryKeys.filter((k) => allKeys.includes(k)),
    ...allKeys
      .filter((k) => !primaryKeys.includes(k))
      .sort((a, b) => (fields ? 0 : a.localeCompare(b))),
  ];

  return (
    <div className="card">
      {title ? <div className="card-header">{title}</div> : null}
      <div className="card-body">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {sortedKeys.map((key) => {
            const field = fields?.[key];
            const value = data?.[key];
            return (
              <FieldRow
                key={key}
                label={key}
                value={value}
                field={field}
                colors={colors}
              />
            );
          })}
        </dl>
      </div>
    </div>
  );
};

type ColorItem = {
  rgba?: string;
  name?: string;
};

const FieldRow = ({
  label,
  value,
  field,
  colors,
}: {
  label: string;
  value: unknown;
  field?: SchemaField;
  colors?: Record<string, ColorItem> | null;
}) => {
  const fk = field?.foreign_key;
  const arrayFk =
    field?.type === 'array' ? field?.items?.foreign_key : undefined;
  const relation = useLookupRelation(fk);
  const arrayRelation = useLookupRelation(arrayFk);

  const isArray = field?.type === 'array';
  const arr: unknown[] = isArray && Array.isArray(value) ? value : [];

  const renderLookupLink = (table: string, id: unknown) => {
    const strId = String(id);
    return (
      <Link
        key={strId}
        to="/enum/$table/$id"
        params={{ table, id: strId }}
        className="no-underline"
      >
        <Badge>{strId}</Badge>
      </Link>
    );
  };

  const renderContent = () => {
    // Handle array of lookup values
    if (isArray && arrayRelation?.isLookup && arrayRelation.table) {
      if (arr.length > 0) {
        return (
          <div className="flex flex-wrap gap-1">
            {arr.map((it, idx) => (
              <React.Fragment key={idx}>
                {renderLookupLink(arrayRelation.table!, it)}
              </React.Fragment>
            ))}
          </div>
        );
      }
      return <span className="text-gray-400">[]</span>;
    }

    // Handle single lookup value
    if (relation?.isLookup && relation.table) {
      if (value != null) {
        return renderLookupLink(relation.table, value);
      }
      return <span className="text-gray-400">—</span>;
    }

    // Default rendering
    return <ValueDisplay value={value} field={field} colors={colors} />;
  };

  return (
    <div>
      <dt className="mb-1 text-xs tracking-wide text-gray-500 uppercase">
        {label}
      </dt>
      <dd className="text-sm text-gray-900">{renderContent()}</dd>
    </div>
  );
};

export default DataGrid;
