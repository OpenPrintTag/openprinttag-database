"""
Tests for migrate.py script - idempotency and URL handling.
"""

import unittest
import tempfile
import yaml
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import sys

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from migrate_images import MaterialImageMigration


class TestMigrateIdempotency(unittest.TestCase):
    """Test that migrate script is idempotent and skips already migrated materials."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.materials_dir = Path(self.temp_dir) / "materials"
        self.output_dir = Path(self.temp_dir) / "output"
        self.materials_dir.mkdir(parents=True)
        
    def test_skip_already_migrated_material(self):
        """Test that materials with new URLs are skipped."""
        # Create test brand directory
        brand_dir = self.materials_dir / "test-brand"
        brand_dir.mkdir()
        
        # Create material with already migrated URL
        material_file = brand_dir / "test-material.yaml"
        material_data = {
            "uuid": "test-uuid",
            "slug": "test-material",
            "brand": {"slug": "test-brand"},
            "name": "Test Material",
            "photos": [
                {
                    "url": "https://files.openprinttag.org/test-brand/test-material/image.jpg",
                    "type": "unspecified"
                }
            ]
        }
        
        with open(material_file, 'w') as f:
            yaml.dump(material_data, f)
        
        # Mock GCS client to avoid real connection
        with patch('migrate_images.storage.Client') as mock_storage:
            mock_client = MagicMock()
            mock_storage.return_value = mock_client
            mock_bucket = MagicMock()
            mock_client.bucket.return_value = mock_bucket
            
            # Create migration instance
            migration = MaterialImageMigration(
                materials_dir=str(self.materials_dir),
                output_dir=str(self.output_dir)
            )
            
            # Process the material
            migration._process_material("test-brand", material_file)
            
            # Material should be skipped (not counted in materials_with_photos)
            self.assertEqual(migration.stats["materials_with_photos"], 0)
            self.assertEqual(migration.stats["total_materials"], 1)
    
    def test_process_not_migrated_material(self):
        """Test that materials with old URLs are processed."""
        # Create test brand directory
        brand_dir = self.materials_dir / "test-brand"
        brand_dir.mkdir()
        
        # Create material with old URL
        material_file = brand_dir / "test-material.yaml"
        material_data = {
            "uuid": "test-uuid",
            "slug": "test-material",
            "brand": {"slug": "test-brand"},
            "name": "Test Material",
            "photos": [
                {
                    "url": "https://old-server.com/image.jpg",
                    "type": "unspecified"
                }
            ]
        }
        
        with open(material_file, 'w') as f:
            yaml.dump(material_data, f)
        
        # Mock GCS client and requests
        with patch('migrate_images.storage.Client') as mock_storage, \
             patch('migrate_images.requests.get') as mock_get:
            
            # Setup GCS mocks
            mock_client = MagicMock()
            mock_storage.return_value = mock_client
            mock_bucket = MagicMock()
            mock_client.bucket.return_value = mock_bucket
            mock_blob = MagicMock()
            mock_bucket.blob.return_value = mock_blob
            mock_blob.exists.return_value = False
            
            # Setup requests mock
            mock_response = MagicMock()
            mock_response.iter_content.return_value = [b"test image data"]
            mock_get.return_value = mock_response
            
            # Create migration instance
            migration = MaterialImageMigration(
                materials_dir=str(self.materials_dir),
                output_dir=str(self.output_dir)
            )
            
            # Process the material
            migration._process_material("test-brand", material_file)
            
            # Material should be processed
            self.assertEqual(migration.stats["materials_with_photos"], 1)
            self.assertEqual(migration.stats["total_materials"], 1)
    
    def test_mixed_urls_in_material(self):
        """Test material with mix of old and new URLs."""
        # Create test brand directory
        brand_dir = self.materials_dir / "test-brand"
        brand_dir.mkdir()
        
        # Create material with mixed URLs
        material_file = brand_dir / "test-material.yaml"
        material_data = {
            "uuid": "test-uuid",
            "slug": "test-material",
            "brand": {"slug": "test-brand"},
            "name": "Test Material",
            "photos": [
                {
                    "url": "https://files.openprinttag.org/test-brand/test-material/image1.jpg",
                    "type": "unspecified"
                },
                {
                    "url": "https://old-server.com/image2.jpg",
                    "type": "unspecified"
                }
            ]
        }
        
        with open(material_file, 'w') as f:
            yaml.dump(material_data, f)
        
        # Mock GCS client and requests
        with patch('migrate_images.storage.Client') as mock_storage, \
             patch('migrate_images.requests.get') as mock_get:
            
            # Setup GCS mocks
            mock_client = MagicMock()
            mock_storage.return_value = mock_client
            mock_bucket = MagicMock()
            mock_client.bucket.return_value = mock_bucket
            mock_blob = MagicMock()
            mock_bucket.blob.return_value = mock_blob
            mock_blob.exists.return_value = False
            
            # Setup requests mock
            mock_response = MagicMock()
            mock_response.iter_content.return_value = [b"test image data"]
            mock_get.return_value = mock_response
            
            # Create migration instance
            migration = MaterialImageMigration(
                materials_dir=str(self.materials_dir),
                output_dir=str(self.output_dir)
            )
            
            # Process the material
            migration._process_material("test-brand", material_file)
            
            # Material should be processed (not all URLs are migrated)
            self.assertEqual(migration.stats["materials_with_photos"], 1)
            self.assertEqual(migration.stats["total_materials"], 1)
    
    def test_no_photos_material(self):
        """Test material without photos."""
        # Create test brand directory
        brand_dir = self.materials_dir / "test-brand"
        brand_dir.mkdir()
        
        # Create material without photos
        material_file = brand_dir / "test-material.yaml"
        material_data = {
            "uuid": "test-uuid",
            "slug": "test-material",
            "brand": {"slug": "test-brand"},
            "name": "Test Material",
        }
        
        with open(material_file, 'w') as f:
            yaml.dump(material_data, f)
        
        # Mock GCS client
        with patch('migrate_images.storage.Client') as mock_storage:
            mock_client = MagicMock()
            mock_storage.return_value = mock_client
            mock_bucket = MagicMock()
            mock_client.bucket.return_value = mock_bucket
            
            # Create migration instance
            migration = MaterialImageMigration(
                materials_dir=str(self.materials_dir),
                output_dir=str(self.output_dir)
            )
            
            # Process the material
            migration._process_material("test-brand", material_file)
            
            # Material should be counted but not processed
            self.assertEqual(migration.stats["materials_with_photos"], 0)
            self.assertEqual(migration.stats["total_materials"], 1)


if __name__ == '__main__':
    unittest.main()
