import { Search, X } from 'lucide-react';
import React from 'react';

export type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  onClear?: () => void;
};

/**
 * Reusable search bar with left search icon and right clear button.
 * Styling follows the existing routes for visual consistency.
 */
export function SearchBar({
  value,
  onChange,
  placeholder,
  className,
  inputProps,
  onClear,
}: SearchBarProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    inputProps?.onChange?.(e);
    onChange(e.target.value);
  };

  const handleClear = () => {
    onClear?.();
    onChange('');
  };

  return (
    <div className={['relative', className].filter(Boolean).join(' ')}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <Search
          className="h-5 w-5"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        />
      </div>
      <input
        type="text"
        className="w-full rounded-xl border py-3.5 pr-12 pl-12 text-base shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none"
        style={{
          backgroundColor: 'hsl(var(--card))',
          color: 'hsl(var(--foreground))',
          borderColor: 'hsl(var(--border))',
        }}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        {...inputProps}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-full p-1.5 transition-all hover:scale-110"
          style={{ color: 'hsl(var(--muted-foreground))' }}
          onClick={handleClear}
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
