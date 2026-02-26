import type { SearchResult } from '~/routes/api/search';

import { TYPE_COLORS, TYPE_ICONS, TYPE_LABELS } from './constants';

interface SearchResultItemProps {
  result: SearchResult;
  index: number;
  isSelected: boolean;
  onSelect: (result: SearchResult) => void;
  onHover: (index: number) => void;
}

export function SearchResultItem({
  result,
  index,
  isSelected,
  onSelect,
  onHover,
}: SearchResultItemProps) {
  return (
    <button
      id={`result-${index}`}
      role="option"
      aria-selected={isSelected}
      data-index={index}
      onClick={() => onSelect(result)}
      onMouseEnter={() => onHover(index)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
      style={{
        backgroundColor: isSelected ? 'hsl(var(--muted))' : 'transparent',
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: TYPE_COLORS[result.type],
          color: 'white',
        }}
      >
        {TYPE_ICONS[result.type]}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="truncate font-medium"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          {result.name}
        </div>
        <div
          className="flex items-center gap-2 truncate text-xs"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          <span>{TYPE_LABELS[result.type]}</span>
          {result.brandName && (
            <>
              <span>•</span>
              <span>{result.brandName}</span>
            </>
          )}
          {result.materialType && (
            <>
              <span>•</span>
              <span>{result.materialType}</span>
            </>
          )}
        </div>
      </div>
      {result.color && (
        <div
          className="h-6 w-6 shrink-0 rounded-full border"
          style={{
            backgroundColor: result.color,
            borderColor: 'hsl(var(--border))',
          }}
        />
      )}
    </button>
  );
}
