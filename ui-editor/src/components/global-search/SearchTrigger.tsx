import { Command, Search } from 'lucide-react';

import { getOS } from '~/utils/os';

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  const isMac = getOS() === 'MacOS';

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all hover:border-gray-400"
      style={{
        backgroundColor: 'hsl(var(--muted))',
        borderColor: 'hsl(var(--border))',
        color: 'hsl(var(--muted-foreground))',
      }}
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search...</span>
      <kbd
        className="ml-2 hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline-flex"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        {isMac ? (
          <>
            <Command className="mr-0.5 inline h-3 w-3" />K
          </>
        ) : (
          'CTRL+K'
        )}
      </kbd>
    </button>
  );
}
