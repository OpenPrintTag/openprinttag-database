import type { Brand as BrandType } from '~/types/brand';

export type Brand = BrandType;

export interface BrandSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: Brand;
  onSuccess?: () => void;
  readOnly?: boolean;
  onEdit?: () => void;
}

export interface LookupData {
  items: Array<Record<string, unknown>>;
}

export interface SelectOption {
  value: string | number;
  label: string;
}
