export interface Package {
  uuid?: string;
  directus_uuid?: string;
  slug?: string;
  class?: 'FFF' | 'SLA';
  brand_slug?: string;
  brand_specific_id?: string;
  gtin?: string;
  material_slug?: string;
  container_slug?: string;
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
