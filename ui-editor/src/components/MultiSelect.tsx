import { ChevronDown, X } from 'lucide-react';
import { type MouseEvent, useEffect, useMemo, useRef, useState } from 'react';

import { SelectOption } from '~/components/field-types';
import { Badge } from '~/components/ui/badge';

interface MultiSelectProps {
  id?: string;
  options: SelectOption[];
  value: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
}

export const MultiSelect = ({
  id,
  options,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside as any);
      document.addEventListener('touchstart', handleClickOutside as any);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside as any);
      document.removeEventListener('touchstart', handleClickOutside as any);
    };
  }, [isOpen]);

  const selectedValues = useMemo(() => new Set(value), [value]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        String(opt.value).toLowerCase().includes(query),
    );
  }, [options, searchQuery]);

  const selectedOptions = useMemo(
    () => options.filter((opt) => selectedValues.has(String(opt.value))),
    [options, selectedValues],
  );

  const handleToggle = (optionValue: string) => {
    const newSelected = new Set(selectedValues);
    if (newSelected.has(optionValue)) {
      newSelected.delete(optionValue);
    } else {
      newSelected.add(optionValue);
    }
    onChange(Array.from(newSelected));
  };

  const handleRemove = (optionValue: string, e: MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedValues);
    newSelected.delete(optionValue);
    onChange(Array.from(newSelected));
  };

  const handleClearAll = (e: MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger button */}
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="input flex min-h-[2.5rem] w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex flex-1 flex-wrap gap-1.5 overflow-hidden">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((opt) => (
              <Badge key={String(opt.value)} variant="secondary">
                <div className="inline-flex items-center gap-1">
                  {opt.label}
                  <span
                    role="button"
                    onClick={(e) => handleRemove(String(opt.value), e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemove(String(opt.value), e as any);
                      }
                    }}
                    className="ml-1 cursor-pointer rounded hover:bg-[hsl(var(--secondary)/.6)] focus:outline-none"
                    aria-label={`Remove ${opt.label}`}
                    tabIndex={-1}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </div>
              </Badge>
            ))
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {selectedOptions.length > 0 && (
            <span
              role="button"
              onClick={handleClearAll}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClearAll(e as any);
                }
              }}
              className="cursor-pointer rounded p-0.5 hover:bg-gray-100 focus:outline-none"
              aria-label="Clear all"
              tabIndex={-1}
            >
              <X className="h-4 w-4 text-gray-500" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-gray-500 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
          {/* Search input */}
          <div className="border-b border-gray-200 p-2">
            <input
              type="text"
              className="input w-full"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              <ul className="py-1" role="listbox" aria-multiselectable="true">
                {filteredOptions.map((opt) => {
                  const isSelected = selectedValues.has(String(opt.value));
                  return (
                    <li
                      key={String(opt.value)}
                      role="option"
                      aria-selected={isSelected}
                      className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-[hsl(var(--accent))] ${
                        isSelected ? 'bg-[hsl(var(--accent)/.5)]' : ''
                      }`}
                      onClick={() => handleToggle(String(opt.value))}
                    >
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(String(opt.value))}
                        onClick={(e) => e.stopPropagation()}
                        tabIndex={-1}
                      />
                      <span className="flex-1">{opt.label}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                No options found
              </div>
            )}
          </div>

          {/* Footer with count */}
          {selectedOptions.length > 0 && (
            <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-600">
              {selectedOptions.length} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
};
