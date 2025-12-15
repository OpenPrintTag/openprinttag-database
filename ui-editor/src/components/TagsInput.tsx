import { X } from 'lucide-react';
import React from 'react';

import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  variant?: 'default' | 'secondary' | 'success';
}

export const TagsInput: React.FC<TagsInputProps> = ({
  value = [],
  onChange,
  placeholder = 'Add tag...',
  variant = 'default',
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputValue('');
    }
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const badgeVariant = variant === 'success' ? 'default' : variant;

  return (
    <div
      className="flex min-h-[2.5rem] w-full flex-wrap gap-2 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm ring-offset-[hsl(var(--background))] focus-within:ring-2 focus-within:ring-[hsl(var(--ring))] focus-within:ring-offset-2"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, index) => (
        <Badge
          key={index}
          variant={badgeVariant}
          className={
            variant === 'success'
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : ''
          }
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(index);
            }}
            className="ml-1 rounded-full ring-offset-[hsl(var(--background))] outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
};
