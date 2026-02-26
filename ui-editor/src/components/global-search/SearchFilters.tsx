import { Building2, ChevronDown, Loader2, Palette, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  SearchFilters as SearchFiltersType,
  SearchResultType,
} from '~/routes/api/search';

import { TYPE_COLORS, TYPE_ICONS_SMALL, TYPE_LABELS } from './constants';
import type { BrandOption } from './types';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Render prop for inline filter chips shown in the search input row */
  renderChips?: (chips: React.ReactNode) => React.ReactNode;
}

const TYPE_OPTIONS: SearchResultType[] = [
  'brand',
  'material',
  'package',
  'container',
];

export function SearchFilterBar({
  filters,
  onFiltersChange,
  inputRef,
  renderChips,
}: SearchFiltersProps) {
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [brandDropdownIndex, setBrandDropdownIndex] = useState(0);
  const [typeDropdownIndex, setTypeDropdownIndex] = useState(0);
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const brandInputRef = useRef<HTMLInputElement>(null);

  // Load brands on first render
  useEffect(() => {
    if (brands.length > 0) return;
    setBrandsLoading(true);
    fetch('/api/brands/basic')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sorted = data
            .map((b: { slug: string; name: string }) => ({
              slug: b.slug,
              name: b.name,
            }))
            .sort((a: BrandOption, b: BrandOption) =>
              a.name.localeCompare(b.name),
            );
          setBrands(sorted);
        }
      })
      .catch(console.error)
      .finally(() => setBrandsLoading(false));
  }, [brands.length]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        brandDropdownRef.current &&
        !brandDropdownRef.current.contains(e.target as Node)
      ) {
        setShowBrandDropdown(false);
      }
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(e.target as Node)
      ) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBrands = brandSearch
    ? brands.filter(
        (b) =>
          b.name.toLowerCase().includes(brandSearch.toLowerCase()) ||
          b.slug.toLowerCase().includes(brandSearch.toLowerCase()),
      )
    : brands;

  const selectedBrandName = filters.brand
    ? brands.find((b) => b.slug === filters.brand)?.name
    : null;

  const hasFilters = (filters.types?.length ?? 0) > 0 || !!filters.brand;

  const toggleTypeFilter = useCallback(
    (type: SearchResultType) => {
      const current = filters.types || [];
      const newTypes = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      onFiltersChange({
        ...filters,
        types: newTypes.length ? newTypes : undefined,
      });
      setShowTypeDropdown(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [filters, onFiltersChange, inputRef],
  );

  const selectBrand = useCallback(
    (brandSlug: string | undefined) => {
      onFiltersChange({ ...filters, brand: brandSlug });
      setShowBrandDropdown(false);
      setBrandSearch('');
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [filters, onFiltersChange, inputRef],
  );

  const handleBrandDropdownKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setBrandDropdownIndex((i) =>
            Math.min(i + 1, filteredBrands.length - 1),
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setBrandDropdownIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredBrands[brandDropdownIndex]) {
            selectBrand(filteredBrands[brandDropdownIndex].slug);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowBrandDropdown(false);
          inputRef.current?.focus();
          break;
      }
    },
    [filteredBrands, brandDropdownIndex, selectBrand, inputRef],
  );

  const handleTypeDropdownKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setTypeDropdownIndex((i) => Math.min(i + 1, TYPE_OPTIONS.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setTypeDropdownIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          toggleTypeFilter(TYPE_OPTIONS[typeDropdownIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          setShowTypeDropdown(false);
          inputRef.current?.focus();
          break;
      }
    },
    [typeDropdownIndex, toggleTypeFilter, inputRef],
  );

  const chips = (
    <SearchFilterChips
      filters={filters}
      selectedBrandName={selectedBrandName}
      onRemoveType={(type) => {
        onFiltersChange({
          ...filters,
          types: filters.types?.filter((t) => t !== type),
        });
      }}
      onRemoveBrand={() => {
        onFiltersChange({ ...filters, brand: undefined });
      }}
    />
  );

  return (
    <>
      {renderChips ? renderChips(chips) : chips}

      <div
        className="relative flex items-center gap-2 overflow-visible border-b px-4 py-2"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        <span
          className="text-xs"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Add filter:
        </span>

        {/* Brand Filter Dropdown */}
        <div className="relative" ref={brandDropdownRef}>
          <button
            onClick={() => {
              setShowBrandDropdown(!showBrandDropdown);
              setShowTypeDropdown(false);
              setBrandDropdownIndex(0);
              setBrandSearch('');
            }}
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-all hover:border-gray-400"
            style={{
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            <Building2 className="h-3 w-3" />
            brand:
            <ChevronDown className="h-3 w-3" />
          </button>

          {showBrandDropdown && (
            <div
              className="absolute top-full left-0 z-[150] mt-1 w-64 overflow-hidden rounded-lg border shadow-lg"
              style={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
              }}
            >
              <div
                className="border-b px-3 py-2"
                style={{ borderColor: 'hsl(var(--border))' }}
              >
                <input
                  ref={brandInputRef}
                  type="text"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                  style={{ color: 'hsl(var(--foreground))' }}
                  placeholder="Filter brands..."
                  value={brandSearch}
                  onChange={(e) => {
                    setBrandSearch(e.target.value);
                    setBrandDropdownIndex(0);
                  }}
                  onKeyDown={handleBrandDropdownKeyDown}
                  autoFocus
                />
              </div>

              <div
                className="max-h-48 overflow-y-auto"
                style={{ scrollbarWidth: 'thin' }}
              >
                {brandsLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                  </div>
                )}

                {!brandsLoading &&
                  filteredBrands.map((brand, index) => {
                    const isHighlighted = index === brandDropdownIndex;
                    const isSelected = filters.brand === brand.slug;
                    let bgColor = 'transparent';
                    if (isHighlighted) bgColor = 'hsl(var(--muted))';
                    else if (isSelected) bgColor = 'hsl(var(--accent))';

                    return (
                      <button
                        key={brand.slug}
                        onClick={() => selectBrand(brand.slug)}
                        onMouseEnter={() => setBrandDropdownIndex(index)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                        style={{ backgroundColor: bgColor }}
                      >
                        <span
                          className="truncate"
                          style={{ color: 'hsl(var(--foreground))' }}
                        >
                          {brand.name}
                        </span>
                        <span
                          className="ml-auto text-xs"
                          style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                          brand:{brand.slug}
                        </span>
                      </button>
                    );
                  })}

                {!brandsLoading && filteredBrands.length === 0 && (
                  <div
                    className="px-3 py-4 text-center text-sm"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    No brands found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Type Filter Dropdown */}
        <div className="relative" ref={typeDropdownRef}>
          <button
            onClick={() => {
              setShowTypeDropdown(!showTypeDropdown);
              setShowBrandDropdown(false);
              setTypeDropdownIndex(0);
            }}
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-all hover:border-gray-400"
            style={{
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            <Palette className="h-3 w-3" />
            in:
            <ChevronDown className="h-3 w-3" />
          </button>

          {showTypeDropdown && (
            <div
              className="absolute top-full left-0 z-[150] mt-1 w-48 overflow-hidden rounded-lg border shadow-lg"
              style={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
              }}
              onKeyDown={handleTypeDropdownKeyDown}
              tabIndex={-1}
              ref={(el) => el?.focus()}
            >
              {TYPE_OPTIONS.map((type, index) => {
                const isActive = filters.types?.includes(type);
                const isHighlighted = index === typeDropdownIndex;
                return (
                  <button
                    key={type}
                    onClick={() => toggleTypeFilter(type)}
                    onMouseEnter={() => setTypeDropdownIndex(index)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    style={{
                      backgroundColor: isHighlighted
                        ? 'hsl(var(--muted))'
                        : 'transparent',
                    }}
                  >
                    <span style={{ color: TYPE_COLORS[type] }}>
                      {TYPE_ICONS_SMALL[type]}
                    </span>
                    <span style={{ color: 'hsl(var(--foreground))' }}>
                      in:{TYPE_LABELS[type].toLowerCase()}
                    </span>
                    {isActive && (
                      <span
                        className="ml-auto text-xs"
                        style={{ color: 'hsl(var(--primary))' }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Clear all filters */}
        {hasFilters && (
          <button
            onClick={() => onFiltersChange({})}
            className="ml-auto flex items-center gap-1 text-xs transition-colors hover:underline"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            Clear filters
          </button>
        )}
      </div>
    </>
  );
}

export function SearchFilterChips({
  filters,
  selectedBrandName,
  onRemoveType,
  onRemoveBrand,
}: {
  filters: SearchFiltersType;
  selectedBrandName: string | null | undefined;
  onRemoveType: (type: SearchResultType) => void;
  onRemoveBrand: () => void;
}) {
  return (
    <>
      {filters.types?.map((type) => (
        <span
          key={type}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
          style={{
            backgroundColor: TYPE_COLORS[type],
            color: 'white',
          }}
        >
          in:{TYPE_LABELS[type].toLowerCase()}
          <button
            onClick={() => onRemoveType(type)}
            className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-white/20"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {filters.brand && selectedBrandName && (
        <span
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
          style={{
            backgroundColor: 'hsl(var(--primary))',
            color: 'white',
          }}
        >
          brand:{selectedBrandName.toLowerCase().replace(/\s+/g, '-')}
          <button
            onClick={onRemoveBrand}
            className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-white/20"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}
    </>
  );
}
