import { EnumItem } from '~/hooks/useEnum';

export interface Material {
  uuid?: string;
  slug?: string;
  name?: string;
  brand?: EnumItem;
  brand_specific_id?: string;
  type?: string;
  class?: string;
  abbreviation?: string;
  url?: string;
  primary_color?: { color_rgba: string } | string;
  secondary_colors?: ({ color_rgba: string } | string)[];
  tags?: string[];
  certifications?: any[];
  photos?: any[];
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MaterialSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string;
  material?: Material;
  brandPackages?: unknown[];
  onAddPackage?: () => void;
  onSuccess?: () => void;
  mode: 'create' | 'edit';
  readOnly?: boolean;
  onEdit?: () => void;
}
