export interface Package {
  uuid?: string;
  directus_uuid?: string;
  slug?: string;
  class?: 'FFF' | 'SLA';
  brand?: string | { slug: string; name?: string };
  brand_specific_id?: string;
  gtin?: string;
  material?: string | { slug: string; name?: string };
  container?: string | { slug: string; name?: string };
  url?: string;
  nominal_netto_full_weight?: number;
  filament_diameter?: number;
  filament_diameter_tolerance?: number;
  nominal_full_length?: number;
  [key: string]: unknown;
}

export interface PackageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string;
  package?: Package;
  onSuccess?: () => void;
  mode: 'create' | 'edit';
  readOnly?: boolean;
  onEdit?: () => void;
}
