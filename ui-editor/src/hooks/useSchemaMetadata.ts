import { useQuery } from '@tanstack/react-query';

export interface EnumMetadata {
  valueField: string;
  labelField: string;
  secondaryLabelField?: string;
}

export interface RelationMetadata {
  entity: string;
  valueField: string;
  labelField: string;
  isArray?: boolean;
}

export interface SchemaMetadataResponse {
  enums: Record<string, EnumMetadata>;
  entities: Record<string, { primaryKey: string; displayField: string }>;
  fieldEnumMap: Record<string, string>;
  fieldRelationMap: Record<string, RelationMetadata>;
}

/**
 * Hook to fetch schema metadata from the server.
 * This provides explicit field mappings for enums and entities,
 * eliminating guessing patterns like `item.slug || item.key || item.name`.
 */
export function useSchemaMetadata() {
  return useQuery<SchemaMetadataResponse>({
    queryKey: ['schema-metadata'],
    queryFn: async () => {
      const res = await fetch('/api/schema-metadata');
      if (!res.ok) {
        throw new Error('Failed to fetch schema metadata');
      }
      return res.json();
    },
    staleTime: Infinity, // Metadata doesn't change during a session
    gcTime: Infinity,
  });
}

/**
 * Get enum metadata for a given table name.
 */
export function getEnumMeta(
  metadata: SchemaMetadataResponse | undefined,
  tableName: string,
): EnumMetadata | null {
  return metadata?.enums[tableName] ?? null;
}

/**
 * Get entity metadata for a given entity name.
 */
export function getEntityMeta(
  metadata: SchemaMetadataResponse | undefined,
  entityName: string,
): { primaryKey: string; displayField: string } | null {
  if (!metadata) return null;
  return (
    metadata.entities[entityName] ??
    metadata.entities[entityName.replace(/s$/, '')] ??
    null
  );
}

/**
 * Get the enum table name for a field.
 */
export function getFieldEnum(
  metadata: SchemaMetadataResponse | undefined,
  fieldName: string,
): string | null {
  return metadata?.fieldEnumMap[fieldName] ?? null;
}

/**
 * Get relation metadata for a field.
 */
export function getFieldRelationMeta(
  metadata: SchemaMetadataResponse | undefined,
  fieldName: string,
): RelationMetadata | null {
  return metadata?.fieldRelationMap[fieldName] ?? null;
}

/**
 * Extract value from an enum item using metadata.
 */
export function extractEnumValue(
  item: Record<string, unknown>,
  tableName: string,
  metadata: SchemaMetadataResponse | undefined,
): string {
  const meta = getEnumMeta(metadata, tableName);
  if (!meta) {
    return String(item.name ?? item.key ?? item.id ?? '');
  }
  return String(item[meta.valueField] ?? '');
}

/**
 * Extract label from an enum item using metadata.
 */
export function extractEnumLabel(
  item: Record<string, unknown>,
  tableName: string,
  metadata: SchemaMetadataResponse | undefined,
): string {
  const meta = getEnumMeta(metadata, tableName);
  if (!meta) {
    return String(
      item.display_name ?? item.name ?? item.key ?? item.slug ?? '',
    );
  }
  return String(item[meta.labelField] ?? item[meta.valueField] ?? '');
}

/**
 * Extract value from an entity item using metadata.
 */
export function extractEntityValue(
  item: Record<string, unknown>,
  entityName: string,
  metadata: SchemaMetadataResponse | undefined,
): string {
  const meta = getEntityMeta(metadata, entityName);
  if (!meta) {
    return String(item.slug ?? item.uuid ?? item.id ?? item.key ?? '');
  }
  return String(item[meta.primaryKey] ?? '');
}

/**
 * Extract label from an entity item using metadata.
 */
export function extractEntityLabel(
  item: Record<string, unknown>,
  entityName: string,
  metadata: SchemaMetadataResponse | undefined,
): string {
  const meta = getEntityMeta(metadata, entityName);
  if (!meta) {
    return String(item.name ?? item.display_name ?? item.slug ?? '');
  }
  return String(item[meta.displayField] ?? item[meta.primaryKey] ?? '');
}

/**
 * Convert enum items to options array.
 */
export function enumToOptions(
  items: Record<string, unknown>[],
  tableName: string,
  metadata: SchemaMetadataResponse | undefined,
): Array<{ value: string; label: string }> {
  return items.map((item) => ({
    value: extractEnumValue(item, tableName, metadata),
    label: extractEnumLabel(item, tableName, metadata),
  }));
}

/**
 * Convert entity items to options array.
 */
export function entityToOptions(
  items: Record<string, unknown>[],
  entityName: string,
  metadata: SchemaMetadataResponse | undefined,
): Array<{ value: string; label: string }> {
  return items.map((item) => ({
    value: extractEntityValue(item, entityName, metadata),
    label: extractEntityLabel(item, entityName, metadata),
  }));
}
