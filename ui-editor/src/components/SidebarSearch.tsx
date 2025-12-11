import React from 'react';

export function SidebarSearch({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  return (
    <div
      className={`sticky top-0 border-b border-gray-200 bg-white p-2 ${className}`}
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="input w-full pr-7"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute top-1/2 right-1 -translate-y-1/2 px-2 text-gray-500 hover:text-gray-800"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default SidebarSearch;
