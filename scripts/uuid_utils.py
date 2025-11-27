"""
UUID Generation and Validation Utilities

Implements UUIDv5 generation according to the specification in uuid.md
"""

import uuid
from typing import Optional


# Namespaces for different entity types as defined in uuid.md
NAMESPACE_BRAND = "5269dfb7-1559-440a-85be-aba5f3eff2d2"
NAMESPACE_MATERIAL = "616fc86d-7d99-4953-96c7-46d2836b9be9"
NAMESPACE_MATERIAL_PACKAGE = "6f7d485e-db8d-4979-904e-a231cd6602b2"
NAMESPACE_MATERIAL_PACKAGE_INSTANCE = "31062f81-b5bd-4f86-a5f8-46367e841508"
NAMESPACE_PALETTE_COLOR = "6c10f945-d488-40aa-8a7e-d6d0bcacaccb"


def generate_uuid(namespace, *args) -> uuid.UUID:
    # Concatenate all arguments as bytes first
    combined_bytes = b"".join(args)
    namespace_uuid = uuid.UUID(namespace)
    return uuid.uuid5(namespace_uuid, combined_bytes)

def generate_brand_uuid(brand_name: str) -> uuid.UUID:
    """
    Generate UUID for a brand from its name.

    Formula: NAMESPACE_BRAND + Brand::name

    Args:
        brand_name: The brand name (string)

    Returns:
        Generated brand UUID
    """
    return generate_uuid(NAMESPACE_BRAND, brand_name.encode("utf-8"))


def generate_material_uuid(brand_uuid: uuid.UUID, material_name: str) -> uuid.UUID:
    return generate_uuid(
        NAMESPACE_MATERIAL,
        brand_uuid.bytes,
        material_name.encode("utf-8")
    )


def generate_material_package_uuid(brand_uuid: uuid.UUID, gtin: int) -> uuid.UUID:
    """
    Generate UUID for a material package from brand UUID and GTIN.

    Formula: NAMESPACE_MATERIAL_PACKAGE + Brand::uuid + MaterialPackage::gtin

    Args:
        brand_uuid: The brand's UUID (binary form)
        gtin: The material package GTIN (int)

    Returns:
        Generated material package UUID
    """
    return generate_uuid(
        NAMESPACE_MATERIAL_PACKAGE,
        brand_uuid.bytes,
        str(gtin).encode("utf-8")
    )
