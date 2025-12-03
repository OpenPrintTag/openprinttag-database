"""
UUID Generation and Validation Utilities

Implements UUIDv5 generation according to the specification in uuid.md
"""

import uuid
from typing import Optional


# Namespaces for different entity types as defined in uuid.md
NAMESPACE_BRAND = uuid.UUID("5269dfb7-1559-440a-85be-aba5f3eff2d2")
NAMESPACE_MATERIAL = uuid.UUID("616fc86d-7d99-4953-96c7-46d2836b9be9")
NAMESPACE_MATERIAL_PACKAGE = uuid.UUID("6f7d485e-db8d-4979-904e-a231cd6602b2")
NAMESPACE_MATERIAL_PACKAGE_INSTANCE = uuid.UUID("31062f81-b5bd-4f86-a5f8-46367e841508")
NAMESPACE_PALETTE_COLOR = uuid.UUID("6c10f945-d488-40aa-8a7e-d6d0bcacaccb")


def generate_uuid(namespace: uuid.UUID, *args) -> uuid.UUID:
    """
    Generate a UUIDv5 from namespace and concatenated arguments.

    Args:
        namespace: The UUID namespace to use
        *args: Variable number of bytes or strings to concatenate

    Returns:
        Generated UUIDv5
    """
    # Concatenate all arguments as bytes first
    combined_bytes = b""
    for arg in args:
        if isinstance(arg, str):
            combined_bytes += arg.encode("utf-8")
        elif isinstance(arg, bytes):
            combined_bytes += arg
        else:
            raise TypeError(f"Arguments must be str or bytes, got {type(arg)}")

    # uuid.uuid5 requires a string argument, so decode the combined bytes
    # For binary data, use latin1 which is a 1-to-1 byte mapping
    combined_str = combined_bytes.decode("latin1")
    return uuid.uuid5(namespace, combined_str)


def generate_brand_uuid(brand_name: str) -> uuid.UUID:
    """
    Generate UUID for a brand from its name.

    Formula: NAMESPACE_BRAND + Brand::name

    Args:
        brand_name: The brand name (string)

    Returns:
        Generated brand UUID
    """
    return generate_uuid(NAMESPACE_BRAND, brand_name)


def generate_material_uuid(brand_uuid: uuid.UUID, material_name: str) -> uuid.UUID:
    """
    Generate UUID for a material from brand UUID and material name.

    Formula: NAMESPACE_MATERIAL + Brand::uuid + Material::name

    Args:
        brand_uuid: The brand's UUID (binary form)
        material_name: The material name (string)

    Returns:
        Generated material UUID
    """
    return generate_uuid(
        NAMESPACE_MATERIAL,
        brand_uuid.bytes,
        material_name
    )


def generate_material_package_uuid(brand_uuid: uuid.UUID, gtin: str) -> uuid.UUID:
    """
    Generate UUID for a material package from brand UUID and GTIN.

    Formula: NAMESPACE_MATERIAL_PACKAGE + Brand::uuid + MaterialPackage::gtin

    Args:
        brand_uuid: The brand's UUID (binary form)
        gtin: The material package GTIN (string)

    Returns:
        Generated material package UUID
    """
    return generate_uuid(
        NAMESPACE_MATERIAL_PACKAGE,
        brand_uuid.bytes,
        gtin
    )


def generate_material_package_instance_uuid(nfc_tag_uid: bytes) -> uuid.UUID:
    """
    Generate UUID for a material package instance from NFC tag UID.

    Formula: NAMESPACE_MATERIAL_PACKAGE_INSTANCE + (NFC tag UID)

    Args:
        nfc_tag_uid: The NFC tag UID as bytes (MUST be 8 bytes for NFCV with 0xE0 as first byte)

    Returns:
        Generated material package instance UUID
    """
    return generate_uuid(NAMESPACE_MATERIAL_PACKAGE_INSTANCE, nfc_tag_uid)


def generate_palette_color_uuid(palette_name: str, canonical_name: str) -> uuid.UUID:
    """
    Generate UUID for a palette color from palette name and canonical name.

    Formula: NAMESPACE_PALETTE_COLOR + ColorPalette::name + PaletteColor::canonical_name

    Args:
        palette_name: The palette name (e.g., "pantone", "ral")
        canonical_name: The canonical color name (e.g., "14-0225 TCX")

    Returns:
        Generated palette color UUID
    """
    return generate_uuid(
        NAMESPACE_PALETTE_COLOR,
        palette_name,
        canonical_name
    )


def validate_brand_uuid(brand_data: dict) -> tuple[bool, Optional[uuid.UUID], Optional[str]]:
    """
    Validate that a brand's UUID matches the derived UUID.

    Args:
        brand_data: Brand entity data dictionary containing 'uuid' and 'name'

    Returns:
        Tuple of (is_valid, expected_uuid, error_message)
    """
    if 'uuid' not in brand_data:
        return False, None, "Missing uuid field"

    if 'name' not in brand_data:
        return False, None, "Missing name field (required for UUID derivation)"

    try:
        actual_uuid = uuid.UUID(brand_data['uuid'])
        expected_uuid = generate_brand_uuid(brand_data['name'])

        if actual_uuid != expected_uuid:
            return False, expected_uuid, f"UUID mismatch: expected {expected_uuid}, got {actual_uuid}"

        return True, expected_uuid, None
    except (ValueError, TypeError) as e:
        return False, None, f"Invalid UUID format: {e}"


def validate_material_uuid(material_data: dict, brand_uuid: uuid.UUID) -> tuple[bool, Optional[uuid.UUID], Optional[str]]:
    """
    Validate that a material's UUID matches the derived UUID.

    Args:
        material_data: Material entity data dictionary containing 'uuid' and 'name'
        brand_uuid: The brand's UUID

    Returns:
        Tuple of (is_valid, expected_uuid, error_message)
    """
    if 'uuid' not in material_data:
        return False, None, "Missing uuid field"

    if 'name' not in material_data:
        return False, None, "Missing name field (required for UUID derivation)"

    try:
        actual_uuid = uuid.UUID(material_data['uuid'])
        expected_uuid = generate_material_uuid(brand_uuid, material_data['name'])

        if actual_uuid != expected_uuid:
            return False, expected_uuid, f"UUID mismatch: expected {expected_uuid}, got {actual_uuid}"

        return True, expected_uuid, None
    except (ValueError, TypeError) as e:
        return False, None, f"Invalid UUID format: {e}"


def validate_material_package_uuid(package_data: dict, brand_uuid: uuid.UUID) -> tuple[bool, Optional[uuid.UUID], Optional[str]]:
    """
    Validate that a material package's UUID matches the derived UUID.

    Args:
        package_data: Material package entity data dictionary containing 'uuid' and 'gtin'
        brand_uuid: The brand's UUID

    Returns:
        Tuple of (is_valid, expected_uuid, error_message)
    """
    if 'uuid' not in package_data:
        return False, None, "Missing uuid field"

    if 'gtin' not in package_data:
        return False, None, "Missing gtin field (required for UUID derivation)"

    try:
        actual_uuid = uuid.UUID(package_data['uuid'])
        expected_uuid = generate_material_package_uuid(brand_uuid, package_data['gtin'])

        if actual_uuid != expected_uuid:
            return False, expected_uuid, f"UUID mismatch: expected {expected_uuid}, got {actual_uuid}"

        return True, expected_uuid, None
    except (ValueError, TypeError) as e:
        return False, None, f"Invalid UUID format: {e}"


def validate_palette_color_uuid(color_data: dict) -> tuple[bool, Optional[uuid.UUID], Optional[str]]:
    """
    Validate that a palette color's UUID matches the derived UUID.

    Args:
        color_data: Palette color entity data dictionary containing 'uuid', 'palette', and 'canonical_name'

    Returns:
        Tuple of (is_valid, expected_uuid, error_message)
    """
    if 'uuid' not in color_data:
        return False, None, "Missing uuid field"

    if 'palette' not in color_data:
        return False, None, "Missing palette field (required for UUID derivation)"

    if 'canonical_name' not in color_data:
        return False, None, "Missing canonical_name field (required for UUID derivation)"

    try:
        actual_uuid = uuid.UUID(color_data['uuid'])
        expected_uuid = generate_palette_color_uuid(
            color_data['palette'],
            color_data['canonical_name']
        )

        if actual_uuid != expected_uuid:
            return False, expected_uuid, f"UUID mismatch: expected {expected_uuid}, got {actual_uuid}"

        return True, expected_uuid, None
    except (ValueError, TypeError) as e:
        return False, None, f"Invalid UUID format: {e}"