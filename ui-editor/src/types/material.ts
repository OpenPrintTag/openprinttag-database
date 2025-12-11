export type UUID = string;
export type Slug = string;

// Minimal Material type for UI rendering; extend as needed to match schema
export interface Material {
  uuid: UUID;
  slug: Slug | null;
  name: string;
  // Optional fields that may exist in YAML but are not strictly required here
  description?: string | null;
  brand_uuid?: UUID | null;
  // Added: brand identifier (folder/slug) for building brand-scoped routes
  brandId?: string | null;
  [key: string]: unknown;
}
