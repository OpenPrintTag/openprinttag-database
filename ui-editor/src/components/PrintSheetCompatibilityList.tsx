import React from 'react';

export interface PrintSheetCompatItem {
  sheet_slug: string;
  level: 'compatible' | 'with_glue_stick' | 'not_recommended' | string;
  heatbed_required?: boolean;
}

export function PrintSheetCompatibilityList({
  items,
}: {
  items?: PrintSheetCompatItem[] | null;
}) {
  if (!items || items.length === 0) return null;

  const levelColor = (level: string) => {
    switch (level) {
      case 'compatible':
        return 'bg-green-100 text-green-800 ring-green-200';
      case 'with_glue_stick':
        return 'bg-amber-100 text-amber-800 ring-amber-200';
      case 'not_recommended':
        return 'bg-red-100 text-red-800 ring-red-200';
      default:
        return 'bg-gray-100 text-gray-800 ring-gray-200';
    }
  };

  const humanize = (s: string) =>
    s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="card">
      <div className="card-header">Print sheet compatibility</div>
      <div className="card-body">
        <div className="divide-y overflow-hidden rounded-md border border-gray-200">
          {items.map((it, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium break-all text-gray-900">
                  {it.sheet_slug}
                </div>
                <div className="text-xs text-gray-500">
                  {humanize(it.sheet_slug)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${levelColor(it.level)}`}
                >
                  {humanize(it.level)}
                </span>
                {typeof it.heatbed_required === 'boolean' ? (
                  <span className="text-xs text-gray-600">
                    Heatbed:{' '}
                    <span className="font-medium">
                      {it.heatbed_required ? 'Required' : 'Not required'}
                    </span>
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PrintSheetCompatibilityList;
