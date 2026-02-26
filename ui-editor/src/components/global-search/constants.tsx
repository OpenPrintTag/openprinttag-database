import { Building2, Package, Palette } from 'lucide-react';
import type React from 'react';

import type { SearchResultType } from '~/routes/api/search';

export const TYPE_ICONS: Record<SearchResultType, React.ReactNode> = {
  brand: <Building2 className="h-4 w-4" />,
  material: <Palette className="h-4 w-4" />,
  package: <Package className="h-4 w-4" />,
  container: <Package className="h-4 w-4" />,
};

export const TYPE_ICONS_SMALL: Record<SearchResultType, React.ReactNode> = {
  brand: <Building2 className="h-3 w-3" />,
  material: <Palette className="h-3 w-3" />,
  package: <Package className="h-3 w-3" />,
  container: <Package className="h-3 w-3" />,
};

export const TYPE_LABELS: Record<SearchResultType, string> = {
  brand: 'Brand',
  material: 'Material',
  package: 'Package',
  container: 'Container',
};

export const TYPE_COLORS: Record<SearchResultType, string> = {
  brand: 'hsl(var(--primary))',
  material: 'hsl(142 76% 36%)',
  package: 'hsl(38 92% 50%)',
  container: 'hsl(280 67% 50%)',
};
