export interface LookupItem {
  id: string | number;
  slug?: string;
  name?: string;
  abbreviation?: string;
}

export interface LookupData {
  items: LookupItem[];
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface PhotoItem {
  url?: string;
  caption?: string;
}

export interface Material {
  uuid?: string;
  slug?: string;
  name?: string;
  type_id?: string | number;
  class?: string;
  primary_color?: string;
  secondary_colors?: string[];
  tags?: string[];
  certifications?: string[];
  photos?: (string | PhotoItem)[];
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MaterialSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string;
  material?: Material;
  onSuccess?: () => void;
  mode: 'create' | 'edit';
  readOnly?: boolean;
  onEdit?: () => void;
}
