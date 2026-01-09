// Primitive aliases reflecting domain-specific scalar types
export type UUID = string;
export type Slug = string;
export type CountryCode = string;

// Enum for link pattern types
export type LinkPatternType =
  | 'brand'
  | 'material'
  | 'material_package'
  | 'material_package_instance';

// Link pattern object structure
export interface LinkPattern {
  type: LinkPatternType;
  pattern: string;
}

export interface Brand extends Record<string, unknown> {
  uuid: UUID;
  slug: Slug;
  name: string;
  keywords?: string[];
  material_url_template?: string;
  material_package_url_template?: string;
  material_package_instance_url_template?: string;
  link_patterns?: LinkPattern[];
  countries_of_origin?: CountryCode[];
  // Computed fields (enriched at API level)
  material_count?: number;
  package_count?: number;
  container_count?: number;
}

export interface BrandSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: Brand;
  onSuccess?: () => void;
  readOnly?: boolean;
  onEdit?: () => void;
}
