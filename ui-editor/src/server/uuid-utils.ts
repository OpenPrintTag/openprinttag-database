import { v5 as uuidv5 } from 'uuid';

const NAMESPACE_BRAND = '5269dfb7-1559-440a-85be-aba5f3eff2d2';
const NAMESPACE_MATERIAL = '616fc86d-7d99-4953-96c7-46d2836b9be9';
const NAMESPACE_MATERIAL_PACKAGE = '6f7d485e-db8d-4979-904e-a231cd6602b2';

/**
 * Generate UUID for a brand from its name
 * Formula: NAMESPACE_BRAND + Brand::name
 */
export const generateBrandUuid = (brandName: string): string => {
  return uuidv5(brandName, NAMESPACE_BRAND);
};

/**
 * Generate UUID for a material from brand UUID and material name
 * Formula: NAMESPACE_MATERIAL + Brand::uuid + Material::name
 */
export const generateMaterialUuid = (
  brandUuid: string,
  materialName: string,
): string => {
  // Build the exact byte sequence: Brand::uuid (16 bytes) + Material::name (utf8)
  const brandUuidBytes = Buffer.from(brandUuid.replace(/-/g, ''), 'hex');
  const materialNameBytes = Buffer.from(materialName, 'utf8');
  const nameBytes = Buffer.concat([brandUuidBytes, materialNameBytes]);

  // Pass bytes directly to uuidv5 to match Python's implementation
  return uuidv5(nameBytes, NAMESPACE_MATERIAL);
};

/**
 * Generate UUID for a material package from brand UUID and GTIN
 * Formula: NAMESPACE_MATERIAL_PACKAGE + Brand::uuid + MaterialPackage::gtin
 */
export const generateMaterialPackageUuid = (
  brandUuid: string,
  gtin: string | number,
): string => {
  // Build the exact byte sequence: Brand::uuid (16 bytes) + MaterialPackage::gtin (utf8)
  const brandUuidBytes = Buffer.from(brandUuid.replace(/-/g, ''), 'hex');
  const gtinStr = String(gtin);
  const gtinBytes = Buffer.from(gtinStr, 'utf8');
  const nameBytes = Buffer.concat([brandUuidBytes, gtinBytes]);

  // Pass bytes directly to uuidv5 to match Python's implementation
  return uuidv5(nameBytes, NAMESPACE_MATERIAL_PACKAGE);
};
