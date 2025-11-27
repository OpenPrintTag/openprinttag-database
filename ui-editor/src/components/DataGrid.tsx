import type { EntityFields, SchemaField } from './fieldTypes';
import { ValueDisplay } from './ValueDisplay';

export interface DataGridProps<T = Record<string, unknown>> {
  data: T;
  title?: string;
  fields?: EntityFields;
  primaryKeys?: string[];
  excludeKeys?: string[];
  entity?: string;
  brandId?: string;
}

export const DataGrid = <
  T extends Record<string, unknown> = Record<string, unknown>,
>({
  data,
  title,
  fields,
  primaryKeys = [],
  excludeKeys = [],
  entity = 'brand',
}: DataGridProps<T>) => {
  const allKeys = fields
    ? Object.keys(fields).filter((k) => !excludeKeys.includes(k))
    : Object.keys(data ?? {}).filter((k) => !excludeKeys.includes(k));

  const sortedKeys = [
    ...primaryKeys.filter((k) => allKeys.includes(k)),
    ...allKeys
      .filter((k) => !primaryKeys.includes(k))
      .sort((a, b) => (fields ? 0 : a.localeCompare(b))),
  ];

  return (
    <div className="card">
      {title && <div className="card-header">{title}</div>}
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
                entity={entity}
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

interface FieldRowProps {
  label: string;
  value: unknown;
  field?: SchemaField;
  colors?: Record<string, ColorItem> | null;
  entity?: string;
}

export const FieldRow = ({
  label,
  value,
  field,
  entity = 'brand',
}: FieldRowProps) => {
  return (
    <div>
      <dt className="mb-1 text-xs tracking-wide text-gray-500 uppercase">
        {label}
      </dt>
      <dd className="text-sm text-gray-900">
        <ValueDisplay
          value={value}
          field={field}
          entity={entity}
          label={label}
        />
      </dd>
    </div>
  );
};
