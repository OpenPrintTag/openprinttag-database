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
  // Convert brand UUID to bytes and concatenate with material name
  const brandUuidBytes = Buffer.from(brandUuid.replace(/-/g, ''), 'hex');
  const materialNameBytes = Buffer.from(materialName, 'utf8');
  const combinedData = Buffer.concat([brandUuidBytes, materialNameBytes]);

  // Convert to latin1 string to match Python's behavior
  const combinedString = combinedData.toString('latin1');
  return uuidv5(combinedString, NAMESPACE_MATERIAL);
};

/**
 * Generate UUID for a material package from brand UUID and GTIN
 * Formula: NAMESPACE_MATERIAL_PACKAGE + Brand::uuid + MaterialPackage::gtin
 */
export const generateMaterialPackageUuid = (
  brandUuid: string,
  gtin: string,
): string => {
  // Convert brand UUID to bytes and concatenate with GTIN
  const brandUuidBytes = Buffer.from(brandUuid.replace(/-/g, ''), 'hex');
  const gtinBytes = Buffer.from(gtin, 'utf8');
  const combinedData = Buffer.concat([brandUuidBytes, gtinBytes]);

  // Convert to latin1 string to match Python's behavior
  const combinedString = combinedData.toString('latin1');
  return uuidv5(combinedString, NAMESPACE_MATERIAL_PACKAGE);
};
