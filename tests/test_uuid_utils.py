"""
Unit tests for UUID Generation and Validation Utilities
"""

import unittest
import uuid

from scripts.uuid_utils import (
    generate_uuid,
    generate_brand_uuid,
    generate_material_uuid,
    generate_material_package_uuid,
    NAMESPACE_BRAND,
    NAMESPACE_MATERIAL,
    NAMESPACE_MATERIAL_PACKAGE,
)


class TestGenerateUUID(unittest.TestCase):
    """Tests for the base generate_uuid function"""

    def test_generate_uuid_deterministic(self):
        """Test that generate_uuid produces deterministic results"""
        namespace = NAMESPACE_BRAND
        data1 = b"test"
        data2 = b"data"

        result1 = generate_uuid(namespace, data1, data2)
        result2 = generate_uuid(namespace, data1, data2)

        self.assertEqual(result1, result2)
        self.assertIsInstance(result1, uuid.UUID)

    def test_generate_uuid_different_inputs(self):
        """Test that different inputs produce different UUIDs"""
        namespace = NAMESPACE_BRAND

        result1 = generate_uuid(namespace, b"test1")
        result2 = generate_uuid(namespace, b"test2")

        self.assertNotEqual(result1, result2)

    def test_generate_uuid_different_namespaces(self):
        """Test that different namespaces produce different UUIDs"""
        data = b"test"

        result1 = generate_uuid(NAMESPACE_BRAND, data)
        result2 = generate_uuid(NAMESPACE_MATERIAL, data)

        self.assertNotEqual(result1, result2)

    def test_generate_uuid_version(self):
        """Test that generated UUIDs are version 5"""
        result = generate_uuid(NAMESPACE_BRAND, b"test")
        self.assertEqual(result.version, 5)


class TestGenerateBrandUUID(unittest.TestCase):
    """Tests for generate_brand_uuid"""

    def test_generate_brand_uuid_deterministic(self):
        """Test that same brand name produces same UUID"""
        brand_name = "Prusa Research"

        result1 = generate_brand_uuid(brand_name)
        result2 = generate_brand_uuid(brand_name)

        self.assertEqual(result1, result2)

    def test_generate_brand_uuid_different_names(self):
        """Test that different brand names produce different UUIDs"""
        result1 = generate_brand_uuid("Brand A")
        result2 = generate_brand_uuid("Brand B")

        self.assertNotEqual(result1, result2)

    def test_generate_brand_uuid_case_sensitive(self):
        """Test that brand UUID generation is case sensitive"""
        result1 = generate_brand_uuid("prusament")
        result2 = generate_brand_uuid("Prusament")

        self.assertNotEqual(result1, result2)

    def test_generate_brand_uuid_special_characters(self):
        """Test brand UUID generation with special characters"""
        brand_name = "Brand & Co. Ltd."
        result = generate_brand_uuid(brand_name)

        self.assertIsInstance(result, uuid.UUID)
        self.assertEqual(result.version, 5)

    def test_generate_brand_uuid_unicode(self):
        """Test brand UUID generation with unicode characters"""
        brand_name = "品牌名称"
        result = generate_brand_uuid(brand_name)

        self.assertIsInstance(result, uuid.UUID)
        self.assertEqual(result.version, 5)

    def test_generate_brand_uuid_empty_string(self):
        """Test brand UUID generation with empty string"""
        result = generate_brand_uuid("")

        self.assertIsInstance(result, uuid.UUID)


class TestGenerateMaterialUUID(unittest.TestCase):
    """Tests for generate_material_uuid"""

    def setUp(self):
        """Set up test fixtures"""
        self.brand_uuid = generate_brand_uuid("Test Brand")

    def test_generate_material_uuid_deterministic(self):
        """Test that same inputs produce same UUID"""
        material_name = "PLA"

        result1 = generate_material_uuid(self.brand_uuid, material_name)
        result2 = generate_material_uuid(self.brand_uuid, material_name)

        self.assertEqual(result1, result2)

    def test_generate_material_uuid_different_materials(self):
        """Test that different material names produce different UUIDs"""
        result1 = generate_material_uuid(self.brand_uuid, "PLA")
        result2 = generate_material_uuid(self.brand_uuid, "PETG")

        self.assertNotEqual(result1, result2)

    def test_generate_material_uuid_different_brands(self):
        """Test that same material name under different brands produces different UUIDs"""
        brand_uuid1 = generate_brand_uuid("Brand A")
        brand_uuid2 = generate_brand_uuid("Brand B")

        result1 = generate_material_uuid(brand_uuid1, "PLA")
        result2 = generate_material_uuid(brand_uuid2, "PLA")

        self.assertNotEqual(result1, result2)

    def test_generate_material_uuid_version(self):
        """Test that generated UUIDs are version 5"""
        result = generate_material_uuid(self.brand_uuid, "PLA")
        self.assertEqual(result.version, 5)


class TestGenerateMaterialPackageUUID(unittest.TestCase):
    """Tests for generate_material_package_uuid"""

    def setUp(self):
        """Set up test fixtures"""
        self.brand_uuid = generate_brand_uuid("Test Brand")

    def test_generate_material_package_uuid_deterministic(self):
        """Test that same inputs produce same UUID"""
        gtin = 1234567890123

        result1 = generate_material_package_uuid(self.brand_uuid, gtin)
        result2 = generate_material_package_uuid(self.brand_uuid, gtin)

        self.assertEqual(result1, result2)

    def test_generate_material_package_uuid_different_gtins(self):
        """Test that different GTINs produce different UUIDs"""
        result1 = generate_material_package_uuid(self.brand_uuid, 1111111111111)
        result2 = generate_material_package_uuid(self.brand_uuid, 2222222222222)

        self.assertNotEqual(result1, result2)

    def test_generate_material_package_uuid_different_brands(self):
        """Test that same GTIN under different brands produces different UUIDs"""
        brand_uuid1 = generate_brand_uuid("Brand A")
        brand_uuid2 = generate_brand_uuid("Brand B")
        gtin = 1234567890123

        result1 = generate_material_package_uuid(brand_uuid1, gtin)
        result2 = generate_material_package_uuid(brand_uuid2, gtin)

        self.assertNotEqual(result1, result2)

    def test_generate_material_package_uuid_version(self):
        """Test that generated UUIDs are version 5"""
        result = generate_material_package_uuid(self.brand_uuid, 1234567890123)
        self.assertEqual(result.version, 5)


class TestSpecificUUIDGeneration(unittest.TestCase):
    """Tests for generating specific UUIDs from real data files"""

    def test_generate_prusament_brand_uuid(self):
        """Test UUID generation for Prusament brand

        Source: data/brands/prusament.yaml
        Expected UUID: ae5ff34e-298e-50c9-8f77-92a97fb30b09
        """
        brand_name = "Prusament"
        expected_uuid = uuid.UUID("ae5ff34e-298e-50c9-8f77-92a97fb30b09")

        result = generate_brand_uuid(brand_name)

        self.assertEqual(result, expected_uuid)
        self.assertEqual(str(result), "ae5ff34e-298e-50c9-8f77-92a97fb30b09")

    def test_generate_prusament_petg_jet_black_material_uuid(self):
        """Test UUID generation for Prusament PETG Jet Black material

        Source: data/materials/prusament/prusament-petg-jet-black.yaml
        Brand: Prusament (ae5ff34e-298e-50c9-8f77-92a97fb30b09)
        Material: PETG Jet Black
        Expected UUID: 1378e978-35ed-534c-9dfa-a65525bf8649
        """
        brand_uuid = uuid.UUID("ae5ff34e-298e-50c9-8f77-92a97fb30b09")
        material_name = "PETG Jet Black"
        expected_uuid = uuid.UUID("1378e978-35ed-534c-9dfa-a65525bf8649")

        result = generate_material_uuid(brand_uuid, material_name)

        self.assertEqual(result, expected_uuid)
        self.assertEqual(str(result), "1378e978-35ed-534c-9dfa-a65525bf8649")

    def test_generate_prusament_petg_jet_black_1000_spool_package_uuid(self):
        """Test UUID generation for Prusament PETG Jet Black 1000g spool package

        Source: data/material-packages/prusament/prusament-petg-jet-black-1000-spool.yaml
        Brand: Prusament (ae5ff34e-298e-50c9-8f77-92a97fb30b09)
        GTIN: 8594173675100
        Expected UUID: 6f957b59-9725-5068-9102-15bb77807534
        """
        brand_uuid = uuid.UUID("ae5ff34e-298e-50c9-8f77-92a97fb30b09")
        gtin = 8594173675100
        expected_uuid = uuid.UUID("6f957b59-9725-5068-9102-15bb77807534")

        result = generate_material_package_uuid(brand_uuid, gtin)

        self.assertEqual(result, expected_uuid)
        self.assertEqual(str(result), "6f957b59-9725-5068-9102-15bb77807534")

    def test_complete_uuid_generation_chain(self):
        """Test complete UUID generation chain from brand to package

        This test verifies the entire UUID generation process:
        1. Generate brand UUID from name
        2. Use brand UUID to generate material UUID
        3. Use brand UUID to generate package UUID

        Source files:
        - data/brands/prusament.yaml
        - data/materials/prusament/prusament-petg-jet-black.yaml
        - data/material-packages/prusament/prusament-petg-jet-black-1000-spool.yaml
        """
        # Step 1: Generate brand UUID
        brand_name = "Prusament"
        brand_uuid = generate_brand_uuid(brand_name)
        expected_brand_uuid = uuid.UUID("ae5ff34e-298e-50c9-8f77-92a97fb30b09")
        self.assertEqual(brand_uuid, expected_brand_uuid)

        # Step 2: Generate material UUID using generated brand UUID
        material_name = "PETG Jet Black"
        material_uuid = generate_material_uuid(brand_uuid, material_name)
        expected_material_uuid = uuid.UUID("1378e978-35ed-534c-9dfa-a65525bf8649")
        self.assertEqual(material_uuid, expected_material_uuid)

        # Step 3: Generate package UUID using generated brand UUID
        gtin = 8594173675100
        package_uuid = generate_material_package_uuid(brand_uuid, gtin)
        expected_package_uuid = uuid.UUID("6f957b59-9725-5068-9102-15bb77807534")
        self.assertEqual(package_uuid, expected_package_uuid)


if __name__ == '__main__':
    unittest.main()
