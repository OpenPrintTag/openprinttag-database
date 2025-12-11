import React, { useMemo, useState } from 'react';

interface MultiSelectOption {
  value: string | number;
  label: string;
}

interface MultiSelectProps {
  id?: string;
  options: MultiSelectOption[];
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

  const selectedOptions = useMemo(() => {
    return options.filter((opt) => selectedValues.has(String(opt.value)));
  }, [options, selectedValues]);

  const handleToggle = (optionValue: string) => {
    const newSelected = new Set(selectedValues);
    if (newSelected.has(optionValue)) {
      newSelected.delete(optionValue);
    } else {
      newSelected.add(optionValue);
    }
    onChange(Array.from(newSelected));
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedValues);
    newSelected.delete(optionValue);
    onChange(Array.from(newSelected));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="relative w-full">
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
        <div className="flex flex-1 flex-wrap gap-1 overflow-hidden">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((opt) => (
              <span
                key={String(opt.value)}
                className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 ring-1 ring-orange-200"
              >
                {opt.label}
                <button
                  type="button"
                  onClick={(e) => handleRemove(String(opt.value), e)}
                  className="ml-0.5 rounded hover:bg-orange-200 focus:outline-none"
                  aria-label={`Remove ${opt.label}`}
                  tabIndex={-1}
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {selectedOptions.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded p-0.5 hover:bg-gray-100 focus:outline-none"
              aria-label="Clear all"
              tabIndex={-1}
            >
              <svg
                className="h-4 w-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          <svg
            className={`h-4 w-4 text-gray-500 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
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
                        className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
                          isSelected ? 'bg-orange-50' : ''
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
        </>
      )}
    </div>
  );
};
